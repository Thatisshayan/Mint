# MINT Desktop App — Design Spec

## Overview

Convert MINT from web app to native desktop app using Tauri 2.x. Single executable, double-click to launch, no Docker/terminal required.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Tauri 2.x (Rust) | ~10MB bundle vs Electron's 150MB+. Native WebView. |
| Backend | Fastify sidecar | Keep existing backend, launch as child process from Rust. |
| Database | SQLite via Prisma | Replace PostgreSQL. Embedded, no server needed. |
| Auth | Skip entirely | Single-user desktop app, auth is unnecessary complexity. |
| FFmpeg | Bundle binary | Self-contained video assembly. |
| Ollama/ComfyUI | Auto-detect + launch | Detect if running, attempt to start if not. |
| Auto-updater | Skipped for now | Manual download updates via GitHub releases. |
| Code signing | Skipped for now | Can add later when ready for public distribution. |

## Architecture

```
MINT Desktop App
├── src-tauri/ (NEW)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/main.rs — Rust entry: start sidecar, manage window, IPC commands
│   ├── capabilities/default.json — Permissions
│   └── icons/ — App icons
├── frontend/ (UNCHANGED)
│   └── Built via Vite → static files served by Tauri WebView
├── backend/ (MINOR CHANGES)
│   ├── prisma/schema.prisma — provider = "sqlite"
│   ├── src/index.ts — SIGTERM handler, MINT_DESKTOP env check
│   ├── src/middleware/auth.ts — Skip auth when MINT_DESKTOP=true
│   └── src/services/db.ts — SQLite-friendly connection
└── Result: .app (macOS), .exe (Windows), .AppImage (Linux)
```

## Phase 1: Core Desktop Shell

### 1.1 Tauri Scaffold
- Create `src-tauri/` with Cargo.toml, tauri.conf.json, main.rs
- Rust main.rs manages sidecar backend process
- Sets DATABASE_URL, JWT_SECRET, PORT, MINT_DESKTOP env vars
- Kills backend on window close (SIGTERM)
- Waits for /health endpoint before loading frontend

### 1.2 SQLite Migration
- Change Prisma schema: `provider = "sqlite"`
- Handle `tags String[]` → keep as String (JSON array serialized)
- Remove `@db.Uuid` if present (already uses cuid())
- Regenerate migrations for SQLite
- Store DB in platform-appropriate app data directory

### 1.3 Backend Auth Bypass
- Add `MINT_DESKTOP=true` env var check in auth middleware
- When set, skip JWT verification, inject default desktop user
- Frontend skips login screen in desktop mode

### 1.4 Backend Graceful Shutdown
- Add SIGTERM/SIGINT handlers
- Close Fastify server, disconnect Prisma, exit cleanly

### 1.5 Frontend API URL
- Use `VITE_API_URL` env var (default: `/api` for web, `http://localhost:4000/api` for desktop)
- Tauri build sets this to localhost URL

### 1.6 Package.json Scripts
- Add `tauri`, `tauri:dev`, `tauri:build` scripts
- Add `@tauri-apps/cli` and `@tauri-apps/api` dependencies

## Phase 2: Native Features
- System tray icon (minimize to tray, click to restore)
- Global keyboard shortcuts
- Window state restore (size/position memory)

## Phase 3: Enhanced Features
- FFmpeg binary bundling
- Ollama/ComfyUI auto-detection and launch
- File system integration (Tauri dialog for export/import)
- AI provider config via Tauri secure store

## Data Directories
- **macOS:** `~/Library/Application Support/com.mint.app/`
- **Windows:** `%APPDATA%/MINT/`
- **Linux:** `~/.local/share/mint/`

## Testing Checklist
1. Double-click app → window opens within 3s
2. No terminal visible
3. Create project → persists in SQLite
4. AI generation works (DeepSeek/OpenAI)
5. Export/import works
6. Close/reopen → data persists
7. Quit/relaunch → state preserved
