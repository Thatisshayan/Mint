use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

const BACKEND_PORT: u16 = 19421;

struct BackendState {
    child: Mutex<Option<u32>>,
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

fn start_backend(app_dir: &std::path::Path, port: u16) -> Option<u32> {
    let db_path = app_dir.join("mint.db");
    let db_url = format!("file:{}", db_path.to_string_lossy());

    // Try to find the backend entry point
    // In dev mode: backend/src/index.ts (run via tsx)
    // In production: backend/dist/index.js (compiled)
    let (cmd, args): (&str, Vec<String>) = if cfg!(debug_assertions) {
        // Dev mode: use tsx to run TypeScript directly
        let backend_entry = std::env::current_dir()
            .ok()
            .map(|p| p.join("backend/src/index.ts"))
            .filter(|p| p.exists())
            .or_else(|| {
                // Try relative to app dir
                std::env::current_exe()
                    .ok()
                    .and_then(|e| e.parent()?.parent()?.parent()?.join("backend/src/index.ts").into())
                    .filter(|p| p.exists())
            });

        match backend_entry {
            Some(entry) => ("node", vec![
                "node".to_string(),
                "--import".to_string(),
                "tsx".to_string(),
                entry.to_string_lossy().to_string(),
            ]),
            None => {
                eprintln!("Backend entry point not found");
                return None;
            }
        }
    } else {
        // Production mode: run compiled JS
        let backend_entry = std::env::current_exe()
            .ok()
            .and_then(|e| {
                let resource_dir = e.parent()?.parent()?;
                let paths = [
                    resource_dir.join("backend/dist/index.js"),
                    resource_dir.join("../../backend/dist/index.js"),
                ];
                paths.into_iter().find(|p| p.exists()).map(|p| p.to_path_buf())
            });

        match backend_entry {
            Some(entry) => ("node", vec!["node".to_string(), entry.to_string_lossy().to_string()]),
            None => {
                eprintln!("Backend entry point not found");
                return None;
            }
        }
    };

    let status = std::process::Command::new(cmd)
        .args(&args[1..])
        .env("DATABASE_URL", &db_url)
        .env("JWT_SECRET", "mint-desktop-secret")
        .env("PORT", port.to_string())
        .env("MINT_DESKTOP", "true")
        .env("NODE_ENV", "development")
        .spawn();

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
    #[cfg(target_os = "unix")]
    {
        unsafe {
            libc::kill(pid as i32, libc::SIGTERM);
        }
    }
}

fn wait_for_backend(port: u16) -> bool {
    let url = format!("http://localhost:{}/health", port);
    for _ in 0..30 {
        if let Ok(res) = reqwest::blocking::get(&url) {
            if res.status().is_success() {
                return true;
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .manage(BackendState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            // Get app data directory for SQLite
            let app_dir = app
                .path()
                .app_local_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");

            // Find a free port
            let port = BACKEND_PORT;
            println!("Using port: {}", port);

            // Start backend
            let child_id = start_backend(&app_dir, port);

            // Store state
            {
                let state = app.state::<BackendState>();
                *state.child.lock().unwrap() = child_id;
            }

            // Wait for backend to be ready
            let ready = wait_for_backend(port);
            if ready {
                println!("Backend is ready on port {}", port);
            } else {
                eprintln!("Backend failed to start within timeout");
            }

            // Get the main window
            let window = app.get_webview_window("main").unwrap();

            // In dev mode, navigate to Vite dev server
            if cfg!(debug_assertions) {
                let dev_url = "http://localhost:5173";
                window.navigate(dev_url.parse().unwrap());
            }

            Ok(())
        })
        .on_window_event(|app, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = app.state::<BackendState>();
                if let Some(child_id) = state.child.lock().unwrap().take() {
                    kill_process(child_id);
                    println!("Backend process {} terminated", child_id);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_ai_status,
            get_backend_port,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
