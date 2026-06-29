use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

const BACKEND_PORT: u16 = 19421;
const WINDOW_STATE_FILE: &str = "window-state.json";

struct BackendState {
    child: Mutex<Option<u32>>,
}

struct WindowStateDir(std::path::PathBuf);
struct AppDataDir(std::path::PathBuf);

#[derive(Serialize, Deserialize, Default, Clone)]
struct WindowState {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
}

#[derive(Serialize, Deserialize)]
struct AiStatus {
    ollama_available: bool,
    comfyui_available: bool,
}

#[tauri::command]
fn get_ai_status() -> AiStatus {
    let ollama_available = reqwest::blocking::get("http://localhost:11434/api/tags").is_ok();
    let comfyui_available =
        reqwest::blocking::get("http://localhost:8188/system_stats").is_ok();
    AiStatus {
        ollama_available,
        comfyui_available,
    }
}

#[tauri::command]
fn get_backend_port() -> u16 {
    BACKEND_PORT
}

#[tauri::command]
fn find_ffmpeg() -> Option<String> {
    // Check common locations
    let candidates = if cfg!(target_os = "windows") {
        vec![
            "ffmpeg.exe".to_string(),
            format!("{}\\ffmpeg\\bin\\ffmpeg.exe", std::env::var("LOCALAPPDATA").unwrap_or_default()),
            format!("{}\\ffmpeg\\bin\\ffmpeg.exe", std::env::var("PROGRAMFILES").unwrap_or_default()),
        ]
    } else if cfg!(target_os = "macos") {
        vec![
            "/opt/homebrew/bin/ffmpeg".to_string(),
            "/usr/local/bin/ffmpeg".to_string(),
            "/usr/bin/ffmpeg".to_string(),
        ]
    } else {
        vec![
            "/usr/bin/ffmpeg".to_string(),
            "/usr/local/bin/ffmpeg".to_string(),
        ]
    };

    for path in &candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.clone());
        }
    }

    // Try which/where command
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
    if let Ok(output) = std::process::Command::new(which_cmd).arg("ffmpeg").output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let first_line = stdout.lines().next().unwrap_or("").trim().to_string();
            if !first_line.is_empty() {
                return Some(first_line);
            }
        }
    }

    None
}

#[tauri::command]
fn start_ollama() -> Result<String, String> {
    // Check if already running
    if reqwest::blocking::get("http://localhost:11434/api/tags").is_ok() {
        return Ok("Ollama is already running".to_string());
    }

    // Try to start ollama serve
    let result = std::process::Command::new("ollama")
        .arg("serve")
        .spawn();

    match result {
        Ok(_child) => {
            // Wait a bit for it to start
            std::thread::sleep(std::time::Duration::from_secs(2));
            if reqwest::blocking::get("http://localhost:11434/api/tags").is_ok() {
                Ok("Ollama started successfully".to_string())
            } else {
                Ok("Ollama process started, may still be initializing".to_string())
            }
        }
        Err(e) => Err(format!("Failed to start Ollama: {}. Is it installed?", e)),
    }
}

#[tauri::command]
fn start_comfyui(app_dir: std::path::PathBuf) -> Result<String, String> {
    // Check if already running
    if reqwest::blocking::get("http://localhost:8188/system_stats").is_ok() {
        return Ok("ComfyUI is already running".to_string());
    }

    // Common ComfyUI locations
    let comfyui_paths = if cfg!(target_os = "windows") {
        vec![
            app_dir.join("../../ComfyUI/main.py"),
            std::path::PathBuf::from("C:\\ComfyUI\\main.py"),
        ]
    } else {
        vec![
            app_dir.join("../../ComfyUI/main.py"),
            std::path::PathBuf::from("~/ComfyUI/main.py"),
        ]
    };

    for main_py in &comfyui_paths {
        if main_py.exists() {
            let python_dir = main_py.parent().unwrap();
            let result = std::process::Command::new("python")
                .arg("main.py")
                .current_dir(python_dir)
                .spawn();

            match result {
                Ok(_child) => {
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    if reqwest::blocking::get("http://localhost:8188/system_stats").is_ok() {
                        return Ok("ComfyUI started successfully".to_string());
                    }
                    return Ok("ComfyUI process started, may still be initializing".to_string());
                }
                Err(e) => return Err(format!("Failed to start ComfyUI: {}", e)),
            }
        }
    }

    Err("ComfyUI not found. Install it from https://github.com/comfyanonymous/ComfyUI".to_string())
}

/// Find the node.exe binary, trying PATH first then common Windows install locations.
fn find_node() -> Option<std::path::PathBuf> {
    // 1. Try PATH via `where.exe node` (Windows)
    if let Ok(out) = std::process::Command::new("where.exe").arg("node").output() {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if let Some(line) = stdout.lines().next() {
                let p = std::path::PathBuf::from(line.trim());
                if p.exists() {
                    println!("Found node via where.exe: {}", p.display());
                    return Some(p);
                }
            }
        }
    }

    // 2. Common Windows install paths
    let candidates = [
        r"C:\Program Files\nodejs\node.exe",
        r"C:\Program Files (x86)\nodejs\node.exe",
    ];
    for c in &candidates {
        let p = std::path::PathBuf::from(c);
        if p.exists() {
            println!("Found node at: {}", p.display());
            return Some(p);
        }
    }

    // 3. AppData\Roaming\nvm (nvm-windows)
    if let Ok(appdata) = std::env::var("APPDATA") {
        let nvm_dir = std::path::PathBuf::from(&appdata).join("nvm");
        if nvm_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
                let mut versions: Vec<_> = entries
                    .flatten()
                    .filter(|e| e.path().is_dir())
                    .collect();
                versions.sort_by_key(|e| e.file_name());
                versions.reverse(); // newest first
                if let Some(v) = versions.first() {
                    let node_exe = v.path().join("node.exe");
                    if node_exe.exists() {
                        println!("Found node via nvm: {}", node_exe.display());
                        return Some(node_exe);
                    }
                }
            }
        }
    }

    eprintln!("node.exe not found! Backend will not start.");
    None
}

fn start_backend(app_dir: &std::path::Path, resource_dir: &std::path::Path, port: u16) -> Option<u32> {
    let db_path = app_dir.join("mint.db");
    let db_url = format!("file:{}", db_path.to_string_lossy());

    // Resolve node executable
    let node_exe = if cfg!(debug_assertions) {
        std::path::PathBuf::from("node")
    } else {
        match find_node() {
            Some(p) => p,
            None => return None,
        }
    };

    // Locate the backend entry point
    let backend_entry = if cfg!(debug_assertions) {
        std::env::current_dir()
            .ok()
            .map(|p| p.join("backend/src/index.ts"))
            .filter(|p| p.exists())
    } else {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|e| e.parent().map(|p| p.to_path_buf()))
            .unwrap_or_default();

        // resource_dir is <install>/resources/ on Windows MSI
        // bundle.resources maps "../backend/dist" -> "resources/backend/dist"
        // so the files land at resource_dir + "backend/dist/"
        let candidates = [
            resource_dir.join("backend/dist/server.cjs"),
            exe_dir.join("resources/backend/dist/server.cjs"),
            exe_dir.join("backend/dist/server.cjs"),
        ];
        println!("Looking for backend in: {:?}", candidates);
        candidates.iter().find(|p| p.exists()).cloned()
    };

    let entry = match backend_entry {
        Some(e) => e,
        None => {
            eprintln!("Backend entry point not found");
            return None;
        }
    };
    println!("Starting backend from: {}", entry.display());

    // Prisma query engine binary — lives next to server.cjs in node_modules/.prisma/client/
    let entry_dir = entry.parent().unwrap_or(std::path::Path::new("."));
    let prisma_engine = entry_dir
        .join("node_modules/.prisma/client/query_engine-windows.dll.node");

    let node_str = node_exe.to_string_lossy().to_string();
    let mut cmd_builder = std::process::Command::new(&node_str);
    cmd_builder
        .arg(entry.to_string_lossy().as_ref())
        .env("DATABASE_URL", &db_url)
        .env("JWT_SECRET", "mint-desktop-secret")
        .env("PORT", port.to_string())
        .env("MINT_DESKTOP", "true")
        .env("NODE_ENV", "production");

    if prisma_engine.exists() {
        println!("Prisma engine: {}", prisma_engine.display());
        cmd_builder.env("PRISMA_QUERY_ENGINE_LIBRARY", prisma_engine.to_string_lossy().as_ref());
    }

    let status = cmd_builder.spawn();

    match status {
        Ok(child) => Some(child.id()),
        Err(e) => {
            eprintln!("Failed to start backend: {}", e);
            None
        }
    }
}

fn kill_process(pid: u32) {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .output();
    }
    #[cfg(unix)]
    {
        unsafe {
            libc::kill(pid as i32, libc::SIGTERM);
        }
    }
}

fn wait_for_backend(port: u16) -> bool {
    let url = format!("http://localhost:{}/health", port);
    // Up to 45s: bundled backend with Prisma DLL can be slow on cold start
    for i in 0..90 {
        if let Ok(res) = reqwest::blocking::get(&url) {
            if res.status().is_success() {
                println!("Backend ready after ~{}ms", i * 500);
                return true;
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    eprintln!("Backend did not respond within 45s");
    false
}

fn load_window_state(app_dir: &std::path::Path) -> WindowState {
    let state_path = app_dir.join(WINDOW_STATE_FILE);
    std::fs::read_to_string(&state_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_window_state(app_dir: &std::path::Path, state: &WindowState) {
    let state_path = app_dir.join(WINDOW_STATE_FILE);
    if let Ok(json) = serde_json::to_string_pretty(state) {
        let _ = std::fs::write(&state_path, json);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(BackendState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            let app_dir = app
                .path()
                .app_local_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");

            // Start backend
            let port = BACKEND_PORT;
            println!("Using port: {}", port);
            let resource_dir = app
                .path()
                .resource_dir()
                .unwrap_or_else(|_| app_dir.clone());
            let child_id = start_backend(&app_dir, &resource_dir, port);
            {
                let state = app.state::<BackendState>();
                *state.child.lock().unwrap() = child_id;
            }

            let ready = wait_for_backend(port);
            if ready {
                println!("Backend is ready on port {}", port);
            } else {
                eprintln!("Backend failed to start within timeout");
            }

            // Restore window state
            let window_state = load_window_state(&app_dir);
            let window = app.get_webview_window("main").unwrap();

            if window_state.x != 0 || window_state.y != 0 {
                let _ = window.set_position(tauri::Position::Physical(
                    tauri::PhysicalPosition::new(window_state.x, window_state.y),
                ));
            }
            if window_state.width > 0 && window_state.height > 0 {
                let _ = window.set_size(tauri::Size::Physical(
                    tauri::PhysicalSize::new(window_state.width, window_state.height),
                ));
            }
            if window_state.maximized {
                let _ = window.maximize();
            }

            app.manage(WindowStateDir(app_dir.clone()));
            app.manage(AppDataDir(app_dir));

            // Dev mode: navigate to Vite dev server
            if cfg!(debug_assertions) {
                let dev_url = "http://localhost:5173";
                window.navigate(dev_url.parse().unwrap());
            }

            // --- System Tray ---
            let show_item = MenuItem::with_id(app, "show", "Show MINT", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit MINT", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("MINT — AI Content Workstation")
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            let state = app.state::<BackendState>();
                            if let Some(child_id) = state.child.lock().unwrap().take() {
                                kill_process(child_id);
                            }
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // --- Global Shortcuts ---
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            {
                let handle = app.handle().clone();
                app.global_shortcut().on_shortcut("CommandOrControl+G", move |_app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let _ = handle.emit("shortcut-generate", ());
                    }
                })?;
            }
            {
                let handle = app.handle().clone();
                app.global_shortcut().on_shortcut("CommandOrControl+S", move |_app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let _ = handle.emit("shortcut-save", ());
                    }
                })?;
            }

            Ok(())
        })
        .on_window_event(|app, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Minimize to tray instead of closing
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }

            if let tauri::WindowEvent::Moved(position) = event {
                if let Some(state_dir) = app.try_state::<WindowStateDir>() {
                    let current = load_window_state(&state_dir.0);
                    let window_state = WindowState {
                        x: position.x,
                        y: position.y,
                        ..current
                    };
                    save_window_state(&state_dir.0, &window_state);
                }
            }

            if let tauri::WindowEvent::Resized(size) = event {
                if let Some(state_dir) = app.try_state::<WindowStateDir>() {
                    let current = load_window_state(&state_dir.0);
                    let window_state = WindowState {
                        width: size.width,
                        height: size.height,
                        ..current
                    };
                    save_window_state(&state_dir.0, &window_state);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_ai_status,
            get_backend_port,
            find_ffmpeg,
            start_ollama,
            start_comfyui,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
