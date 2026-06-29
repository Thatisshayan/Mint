# GROUND TRUTH — MINT Project

**Single source of truth. Updated after every significant change.**

*Last updated: June 2026 — Desktop app working, installs and launches correctly.*

---

## Current State

MINT is a **fully working Windows desktop app** (Tauri 2 + MSI installer). It opens directly to the Dashboard with no login screen. The backend runs as a local Fastify 5 sidecar on `localhost:19421` with a SQLite database. All sprints are complete.

---

## What Works (Verified on Installed App)

### Desktop Shell (Tauri 2)
- Installs via Windows MSI (`MINT_0.1.0_x64_en-US.msi`)
- Starts `node server.cjs` as a sidecar process on launch
- Discovers Node.js via PATH → `C:\Program Files\nodejs\` → nvm-windows
- Polls `/health` for up to 45s before declaring backend failed
- Opens directly to Dashboard (no login screen)
- `withGlobalTauri: true` — Tauri APIs globally available
- CSP: `script-src 'self' 'unsafe-inline'` — WebView2 compatible

### Frontend
- **ThemeProvider** wraps the entire app in `main.tsx` — dark/light mode works
- **React Router**: `/` → `/app/dashboard`, `/landing` kept for web mode
- **Desktop session**: hardcoded `DESKTOP_SESSION` (`desktop-user`) — no auth needed
- **API routing**: detects `__TAURI_INTERNALS__` → sends requests to `http://localhost:19421/api`
- **Global error display**: JS crashes show readable error in red instead of blank white screen
- All pages: Dashboard, Projects, Studio, Research, Library, Publish — lazy loaded
- Framer Motion animations, TanStack Query caching, Toast notifications

### Backend
- **Fastify 5** with all `@fastify/*` plugins on v5-compatible versions
- **SQLite** via Prisma 6 — no external DB server needed
- **Schema auto-init**: `CREATE TABLE IF NOT EXISTS` on every startup — no `prisma migrate` needed in production
- **Desktop-user upsert**: ensures FK constraints are satisfied on first launch
- **Auth bypass**: `MINT_DESKTOP=true` → any `Bearer desktop-token` header → authenticated as `desktop-user`
- All routes: `/api/auth`, `/api/projects`, `/api/studio`, `/api/research`, `/api/library`, `/api/publish`, `/api/templates`, `/api/export`
- Health endpoint at `/health`

### Build Pipeline
- `backend:build`: `prisma generate` → esbuild bundle → copy Prisma + native DLL
- Prisma's `@prisma/client` and `.prisma/client` copied alongside `server.cjs` (not bundled — CJS incompatibility)
- `PRISMA_QUERY_ENGINE_LIBRARY` env var set by Tauri at runtime
- `tauri:build`: produces 28MB MSI in `src-tauri/target/release/bundle/msi/`

---

## Plugin / Dependency Versions (Verified Working)

| Package | Version |
|---------|---------|
| fastify | 5.9.0 |
| @fastify/cors | 11.2.0 |
| @fastify/helmet | 13.0.2 |
| @fastify/jwt | 10.1.0 |
| @fastify/static | 9.1.3 |
| @prisma/client | 6.19.3 |
| prisma | 6.19.3 |
| react | 18.x |
| react-router-dom | 7.x |
| @tanstack/react-query | 5.x |
| framer-motion | 11.x |
| vite | 6.4.3 |
| tauri | 2.x |

---

## Architecture Summary

- **Frontend** → WebView2 inside Tauri shell → React SPA
- **Backend** → Node.js sidecar (`server.cjs`) → Fastify 5 → Prisma → SQLite
- **Auth** → Desktop mode bypasses all auth; web mode uses magic link (dev auto-verify)
- **AI** → DeepSeek V3 (primary) → OpenAI → Ollama fallback
- **Storage** → `%APPDATA%\com.mint.app\mint.db`

See `ARCHITECTURE.md` for full data flow.

---

## Known Issues / Accepted Limitations

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| ISS-001 | No real SMTP — magic link only works in web dev mode | Low | Accepted — desktop has no auth |
| ISS-002 | Auth verify accepts any token in web dev mode | Low | Accepted — personal use |
| ISS-003 | No CSRF protection | Low | Accepted — desktop only |
| ISS-004 | Node.js must be pre-installed by user | Medium | Accepted — documented in README |
| ISS-005 | MSI uninstall exits with code 1603 if files are locked; files still removed | Low | Workaround: manual cleanup in registry/folder if needed |

---

## What's Not Started / Out of Scope

| Feature | Notes |
|---------|-------|
| Real email delivery | Not needed for personal desktop use |
| Cloud sync | Intentional — all data stays local |
| Linux / macOS builds | Tauri supports them; not configured yet |
| Sentry / error tracking | Optional — error display added to main.tsx for debugging |
| Docker deployment | Compose files exist from earlier web-server phase; not maintained |

---

## Development Commands

```bash
# Desktop development
npm run tauri:dev        # Hot-reloading Tauri window

# Web development (no Tauri)
npm run dev:all          # Backend :19421 + Frontend :5173

# Build
npm run backend:build    # esbuild bundle + Prisma copy
npm run tauri:build      # Full MSI build

# Test / Lint
npm run test
npm run lint
npm run format
```

---

## Sprint History

| Sprint | When | Summary |
|--------|------|---------|
| Sprint 0 | June 2026 | Fixed 14 bugs (routes, imports, tsconfig, auth) |
| Sprint 1a | June 2026 | Library, Publish, Research pages + CRUD endpoints |
| Sprint 1b | June 2026 | AI provider wiring, status badge, cost tracking |
| Sprint 2a | June 2026 | A/B prompt testing, content moderation, circuit breaker |
| Sprint 2b | June 2026 | Keyboard shortcuts, export formats, toasts, dark mode |
| Sprint 3a | June 2026 | Structured logging, offline indicator |
| Sprint 3b | June 2026 | Tests, CI, one-command startup, docs |
| Sprint 4a | June 2026 | Tags, search, favorites, templates |
| Sprint 4b | June 2026 | Dashboard, quick generate, auto-save |
| Sprint 5 | June 2026 | Animations, responsive, export, README |
| Desktop 1 | June 2026 | Tauri 2 shell, esbuild bundle, Prisma sidecar, find_node() |
| Desktop 2 | June 2026 | Remove auth gate — Desktop opens straight to Dashboard |
| Desktop 3 | June 2026 | Fix Fastify v4→v5, add schema auto-init, fix Tauri detection |
| Desktop 4 | June 2026 | Fix ThemeProvider missing from tree — resolves white screen |
