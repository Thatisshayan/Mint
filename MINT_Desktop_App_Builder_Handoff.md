# MINT Native Desktop App — Builder Handoff Document

**Project:** Convert MINT (AI Content Workstation) from web app to native desktop app  
**Goal:** Single executable file. Double-click → app opens. No Docker, no terminal, no pre-running steps.  
**Target Platforms:** macOS (primary), Windows (secondary), Linux (optional)  
**Deadline:** [To be agreed]  
**Repository:** https://github.com/Thatisshayan/Mint  

---

## 1. Executive Summary

MINT is a personal AI content creation tool that currently runs as a web app requiring:
- Docker Compose (`docker-compose up`) OR
- Manual setup: PostgreSQL + `npm install` + `npm run dev:all`

**We want to eliminate all of this.** The user should double-click an app icon and MINT opens instantly, with all backend services, database, and AI integrations bundled inside.

---

## 2. Current Architecture (What Exists Now)

```
MINT Web App (Current)
├── Frontend: React 18 + Vite 6 + TypeScript 5.7 + Tailwind CSS 3
│   ├── Pages: Landing, Dashboard, Studio, Research, Library, Publish, Projects
│   ├── State: TanStack Query + Zustand
│   ├── UI: shadcn/ui + Framer Motion
│   └── Dev server: http://localhost:5173
│
├── Backend: Fastify 4 + TypeScript 5.7 + Prisma 6
│   ├── Routes: /api/auth, /api/projects, /api/studio, /api/research, /api/library, /api/publish, /api/templates, /api/export
│   ├── AI Providers: DeepSeek API, OpenAI API, Ollama (local), ComfyUI (local images)
│   ├── Media: MoneyPrinterTurbo (video), Edge TTS (voice), Pexels (stock), Whisper (transcribe), FFmpeg (assembly)
│   ├── Database: PostgreSQL (Docker) OR SQLite (fallback)
│   └── Server: http://localhost:4000
│
├── Dev Mode: `npm run dev:all` starts both frontend + backend
├── Docker Mode: `docker-compose up` starts PostgreSQL + backend + frontend + MoneyPrinterTurbo
└── Auth: Dev-only magic link (auto-verifies, no real email)
```

**Key Files:**
- `frontend/src/App.tsx` — React router + lazy-loaded pages
- `backend/src/index.ts` — Fastify server entry
- `backend/prisma/schema.prisma` — Database schema (5 models)
- `backend/src/services/ai/index.ts` — AI provider factory with circuit breakers
- `docker-compose.yml` — Current orchestration
- `package.json` — Root package with scripts

---

## 3. Target Architecture (What We Want)

```
MINT Desktop App (Target)
├── Native Shell: Tauri 2.x (Rust) — window management, system tray, file system, notifications
│   └── Bundles a WebView (macOS: WKWebView, Windows: WebView2, Linux: WebKitGTK)
│
├── Frontend Layer: EXACT SAME React app (zero changes)
│   ├── Built via Vite → static files served by Tauri
│   └── Communicates with backend via HTTP localhost (internal, invisible to user)
│
├── Backend Layer: Fastify (kept as-is initially, then optionally migrated to Rust)
│   ├── Runs as "sidecar" process managed by Tauri
│   ├── Database: SQLite (embedded file, no PostgreSQL needed)
│   ├── AI calls: HTTP to external APIs (DeepSeek, OpenAI) or localhost (Ollama, ComfyUI)
│   └── File storage: Local filesystem (exports, generated media, logs)
│
├── External Dependencies (user must install separately):
│   ├── Ollama (optional, for free local AI) — https://ollama.ai
│   └── ComfyUI (optional, for local image generation) — user-managed
│   └── FFmpeg (optional, for video assembly) — can be bundled or system-installed
│
└── Result: Single .app (macOS), .exe (Windows), or .AppImage (Linux)
    └── User double-clicks → window opens → ready to use
```

---

## 4. Technical Requirements

### 4.1 Must Have (Non-Negotiable)

| # | Requirement | Details |
|---|-------------|---------|
| 1 | **One-click launch** | Double-click app icon → window opens within 3 seconds |
| 2 | **No terminal commands** | User never runs `npm`, `docker`, `cargo`, etc. |
| 3 | **No Docker** | Everything bundled or replaced with native equivalents |
| 4 | **SQLite instead of PostgreSQL** | Replace Prisma provider from `postgresql` to `sqlite` |
| 5 | **Fastify backend as sidecar** | Tauri launches Fastify on startup, kills it on quit |
| 6 | **Frontend unchanged** | Zero modifications to React code — it's already Vite-based |
| 7 | **Auth bypass for personal use** | Remove login screen; auto-authenticate as default user |
| 8 | **Data persistence** | SQLite file stored in user's app data directory |
| 9 | **Export/Import works** | JSON export/import reads/writes to user's Documents folder |
| 10 | **Graceful shutdown** | SIGTERM handler ensures SQLite closes cleanly |

### 4.2 Should Have (Important)

| # | Requirement | Details |
|---|-------------|---------|
| 11 | **System tray icon** | App runs in tray; click to show/hide window |
| 12 | **Keyboard shortcuts** | Global shortcuts (Ctrl+G generate, Ctrl+S save) work natively |
| 13 | **Auto-updater** | Check for updates on startup (Tauri has built-in support) |
| 14 | **Window state restore** | Remember window size and position between launches |
| 15 | **Offline indicator** | Show when internet/AI providers are unavailable |

### 4.3 Nice to Have (Future)

| # | Requirement | Details |
|---|-------------|---------|
| 16 | **Rust backend rewrite** | Gradually replace Fastify with Rust (Axum/Actix) for smaller bundle |
| 17 | **FFmpeg bundling** | Include FFmpeg binary for video assembly |
| 18 | **Ollama auto-detection** | Detect if Ollama is running locally, show status |
| 19 | **ComfyUI integration** | Launch/manage ComfyUI from within the app |

---

## 5. Database Migration: PostgreSQL → SQLite

### 5.1 Schema Changes Required

Current schema uses `postgresql` provider:
```prisma
// backend/prisma/schema.prisma (CURRENT)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Change to:
```prisma
// backend/prisma/schema.prisma (TARGET)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // "file:./mint.db" for desktop
}
```

### 5.2 SQLite Compatibility Notes

- **Prisma SQLite does NOT support `@db.Uuid` or `uuid()`** — keep using `cuid()` (already used)
- **No `Json` type in SQLite** — keep `String` for metadata fields (already done)
- **No array types in SQLite** — `tags String[]` may need changing to relation or JSON string
- **Case-insensitive search** — `mode: 'insensitive'` works in Prisma with SQLite via `COLLATE NOCASE`
- **Migrations** — regenerate migrations for SQLite target

### 5.3 Data Directory

Store SQLite file in platform-appropriate location:
- **macOS:** `~/Library/Application Support/com.mint.app/mint.db`
- **Windows:** `%APPDATA%/MINT/mint.db`
- **Linux:** `~/.local/share/mint/mint.db`

Use Tauri's `app_local_data_dir()` or `dirs` crate to get this path.

---

## 6. Authentication Simplification

Current auth is a dev-only facade:
1. User enters email → frontend calls `/auth/magic-link`
2. Backend returns `{ sent: true }` (no email sent)
3. Frontend auto-calls `/auth/verify` with hardcoded `dev-token`
4. JWT stored in localStorage

**For desktop app, remove all of this:**

```typescript
// Simplified approach:
// On app startup, backend auto-creates a default user if none exists
// Frontend skips login screen entirely
// All requests include a hardcoded "desktop-user" token
// OR: Remove auth middleware entirely for desktop builds
```

**Implementation options (pick one):**

**Option A: Skip auth entirely**
- Remove `authMiddleware` from all routes in desktop build
- Fastify routes run without auth checks
- Simplest, fastest

**Option B: Auto-auth with hardcoded token**
- Keep middleware but auto-generate a token on startup
- Store in Tauri's secure store (not localStorage)
- Frontend reads token from Tauri and includes in headers

**Recommended: Option A** for personal use. The app is single-user; auth is unnecessary complexity.

---

## 7. Tauri Configuration Details

### 7.1 Project Structure

```
MINT/                          (existing repo root)
├── src-tauri/                 (NEW: Tauri Rust project)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   └── main.rs            # Rust entry: start sidecar, manage window
│   ├── capabilities/          # Permission definitions
│   └── icons/                 # App icons
├── frontend/                  (existing, unchanged)
├── backend/                   (existing, minor changes)
│   ├── prisma/schema.prisma   # Change to SQLite
│   └── src/index.ts           # Add SIGTERM handler, SQLite path
├── package.json               # Add Tauri scripts
└── ...existing files
```

### 7.2 Tauri Configuration (`tauri.conf.json`)

```json
{
  "productName": "MINT",
  "version": "0.1.0",
  "identifier": "com.mint.app",
  "build": {
    "frontendDist": "../frontend/dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "MINT — AI Content Workstation",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 700,
        "center": true,
        "decorations": true,
        "transparent": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:4000 https:; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "appimage"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```

### 7.3 Rust Main (`src-tauri/src/main.rs`)

```rust
// src-tauri/src/main.rs
use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;

struct AppState {
    backend: Mutex<Option<Child>>,
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            backend: Mutex::new(None),
        })
        .setup(|app| {
            // Get app data directory for SQLite
            let app_dir = app.path().app_local_data_dir().unwrap();
            std::fs::create_dir_all(&app_dir).unwrap();

            // Set DATABASE_URL for backend
            let db_path = app_dir.join("mint.db");
            std::env::set_var("DATABASE_URL", format!("file:{}", db_path.display()));
            std::env::set_var("JWT_SECRET", "mint-desktop-secret");
            std::env::set_var("PORT", "0"); // Let OS assign random port

            // Start Fastify backend as sidecar
            let backend_path = app.path().resolve(
                "backend/dist/index.js",
                tauri::path::BaseDirectory::Resource,
            ).unwrap();

            let child = Command::new("node")
                .arg(backend_path)
                .env("DATABASE_URL", format!("file:{}", db_path.display()))
                .spawn()
                .expect("Failed to start backend");

            *app.state::<AppState>().backend.lock().unwrap() = Some(child);

            // Wait for backend to be ready (poll /health)
            tauri::async_runtime::spawn(async move {
                let client = reqwest::Client::new();
                for _ in 0..30 {
                    if let Ok(res) = client.get("http://localhost:4000/health").send().await {
                        if res.status().is_success() {
                            break;
                        }
                    }
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            });

            Ok(())
        })
        .on_window_event(|app, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Kill backend on window close
                if let Ok(mut backend) = app.state::<AppState>().backend.lock() {
                    if let Some(mut child) = backend.take() {
                        let _ = child.kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 7.4 Capabilities (Permissions)

```json
// src-tauri/capabilities/default.json
{
  "identifier": "default",
  "description": "Default capabilities for MINT",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-app-read",
    "fs:allow-app-write",
    "fs:allow-app-read-recursive",
    "fs:allow-app-write-recursive",
    "fs:allow-document-read",
    "fs:allow-document-write",
    "dialog:allow-open",
    "dialog:allow-save",
    "notification:default",
    "shell:allow-execute"
  ]
}
```

---

## 8. Backend Modifications Required

### 8.1 Database Connection (`backend/src/services/db.ts`)

Ensure Prisma client reads `DATABASE_URL` from environment:

```typescript
// backend/src/services/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDb() {
  // Prisma connects lazily on first query
  // For SQLite, ensure directory exists
  const dbUrl = process.env.DATABASE_URL || 'file:./mint.db';
  console.log(`Database: ${dbUrl}`);
}
```

### 8.2 Graceful Shutdown (`backend/src/index.ts`)

Add SIGTERM/SIGINT handlers:

```typescript
// Add to backend/src/index.ts before app.listen()
process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  app.log.info('SIGINT received, shutting down...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});
```

### 8.3 Port Configuration

Allow dynamic port assignment (Tauri may set `PORT=0` for random port):

```typescript
// backend/src/index.ts
const port = Number(process.env.PORT || 4000);
// If PORT=0, let OS assign (then need to communicate port to frontend)
```

**Alternative:** Use a fixed internal port (e.g., 19421) unlikely to conflict.

### 8.4 Frontend API URL

Current frontend uses `API_BASE_URL = '/api'` (browser) or `http://localhost:4000/api` (SSR).

For desktop, change to fixed localhost port:

```typescript
// frontend/src/lib/api/fetchWrapper.ts
const API_BASE_URL = 'http://localhost:4000/api'; // Fixed port
```

Or make it configurable via environment:

```env
# frontend/.env
VITE_API_URL=http://localhost:4000/api
```

### 8.5 Remove Auth Middleware (Option A)

Comment out or conditionally skip auth:

```typescript
// backend/src/middleware/auth.ts
export async function authMiddleware(request, reply) {
  // Desktop mode: skip auth
  if (process.env.MINT_DESKTOP === 'true') {
    request.user = { sub: 'desktop-user', email: 'user@mint.local' };
    return;
  }
  // ...existing auth logic
}
```

Set `MINT_DESKTOP=true` in Tauri's environment.

---

## 9. Build & Distribution Process

### 9.1 Development Workflow

```bash
# 1. Start Tauri dev mode (auto-reloads frontend + backend)
npm run tauri dev

# 2. Or separately:
npm run dev          # Frontend Vite dev server
npm run backend:dev  # Fastify backend
cd src-tauri && cargo tauri dev  # Tauri shell
```

### 9.2 Production Build

```bash
# One command builds everything:
npm run tauri build

# This runs:
# 1. npm run build (Vite production build of frontend)
# 2. npm run backend:build (TypeScript compile backend)
# 3. cargo tauri build (Rust compile + bundle)

# Outputs:
# src-tauri/target/release/bundle/
# ├── MINT_0.1.0_x64.dmg          (macOS)
# ├── MINT_0.1.0_x64_en-US.msi    (Windows)
# └── MINT_0.1.0_amd64.AppImage   (Linux)
```

### 9.3 CI/CD for Automated Builds

```yaml
# .github/workflows/release.yml (suggested)
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-action@stable
      - run: npm install
      - run: npm run tauri build
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 10. File System Integration

### 10.1 Export/Import Directory

Use Tauri's dialog API to let user pick save location:

```typescript
// In frontend, replace direct download with Tauri dialog
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

async function exportData(data: object) {
  const path = await save({
    defaultPath: `mint-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (path) {
    await writeTextFile(path, JSON.stringify(data, null, 2));
  }
}
```

### 10.2 Media Storage

Store generated images/videos in app data directory:
- **Exports:** `~/Documents/MINT/` (user-accessible)
- **Cache/temp:** `~/Library/Application Support/com.mint.app/cache/` (internal)

---

## 11. AI Provider Configuration for Desktop

### 11.1 External APIs (Require Internet)

Store API keys in Tauri's secure store (encrypted) instead of `.env`:

```typescript
// Use Tauri secure store for API keys
import { Store } from '@tauri-apps/plugin-store';

const store = new Store('settings.bin');
await store.set('deepseekApiKey', userKey);
await store.save();

// Backend reads from store instead of env
```

### 11.2 Local AI (Ollama)

Auto-detect Ollama on startup:

```rust
// In Rust setup, check if Ollama is running
fn check_ollama() -> bool {
    reqwest::blocking::get("http://localhost:11434/api/tags").is_ok()
}
```

Show status in UI via Tauri command:

```rust
#[tauri::command]
fn get_ai_status() -> AiStatus {
    AiStatus {
        ollama_available: check_ollama(),
        deepseek_configured: !std::env::var("DEEPSEEK_API_KEY").unwrap_or_default().is_empty(),
    }
}
```

---

## 12. Testing Checklist

Before delivery, verify:

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Double-click app icon | Window opens within 3 seconds |
| 2 | No terminal visible | App runs as native window |
| 3 | Create project | Saves to SQLite, persists after restart |
| 4 | Generate content with DeepSeek | AI response appears in Studio |
| 5 | Save to Library | Item appears in Library page |
| 6 | Export data | JSON file saved to chosen location |
| 7 | Close window, reopen | Data still present |
| 8 | Quit app, relaunch | App restarts with previous state |
| 9 | Offline mode (Ollama) | Works without internet |
| 10 | System tray | App minimizes to tray, click to restore |

---

## 13. Deliverables

| # | Deliverable | Format |
|---|-------------|--------|
| 1 | macOS app bundle | `MINT.app` (drag to Applications) |
| 2 | Windows installer | `MINT-setup.exe` (install wizard) |
| 3 | Source code changes | Git patch or PR to existing repo |
| 4 | Build instructions | README in `src-tauri/` |
| 5 | CI/CD workflow | `.github/workflows/release.yml` |

---

## 14. Questions for Builder

Please confirm understanding of:

1. **Database:** SQLite replacement for PostgreSQL — any concerns with Prisma schema migration?
2. **Auth:** Remove login screen entirely — acceptable for single-user desktop app?
3. **Backend:** Keep Fastify as sidecar vs. rewrite in Rust — preference?
4. **FFmpeg:** Bundle binary or require system install?
5. **Ollama/ComfyUI:** External dependencies OK, or auto-install logic needed?
6. **Auto-updater:** Include Tauri's built-in updater?
7. **Code signing:** macOS notarization + Windows code signing — budget for certificates?

---

## 15. Appendix: Existing Code References

### Key Files to Review
- `backend/src/index.ts` — Server entry, route registration
- `backend/prisma/schema.prisma` — Database schema
- `frontend/src/App.tsx` — React router
- `frontend/src/lib/api/fetchWrapper.ts` — API client
- `docker-compose.yml` — Current service orchestration
- `package.json` — Scripts and dependencies

### Environment Variables (Current)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434
COMFYUI_BASE_URL=...
MONEY_PRINTER_URL=...
PEXELS_API_KEY=...
```

### API Endpoints (All routes use `/api` prefix)
```
GET  /health
POST /auth/magic-link
POST /auth/verify
POST /auth/refresh
POST /auth/logout
GET  /auth/me
GET  /projects, POST /projects, GET /projects/:id, PATCH /projects/:id, DELETE /projects/:id
POST /studio/generate, /studio/generate-image, /studio/generate-voice, /studio/generate-video
GET  /studio/generate-video/:taskId, POST /studio/search-stock, /studio/assemble-video, /studio/transcribe
POST /studio/generate-ideas, /studio/rate, GET /studio/prompt-stats, /studio/cost-stats, /studio/ai-status
GET  /research, POST /research, GET /research/:id, DELETE /research/:id
GET  /library, GET /library/search, PATCH /library/:id, POST /library/:id/toggle-favorite
POST /library, GET /library/:id, DELETE /library/:id
GET  /publish, POST /publish, GET /publish/:id, DELETE /publish/:id
GET  /templates, POST /templates, GET /templates/:id, DELETE /templates/:id
GET  /export/all, POST /export/restore
```

---

**Document Version:** 1.0  
**Prepared for:** External builder / contractor  
**Questions:** Contact repo owner (Thatisshayan)
