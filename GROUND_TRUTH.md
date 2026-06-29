# GROUND TRUTH — MINT Project

**Single source of truth. Updated after every significant change.**

*Last updated: June 2026 — Local AI services working, Windows installer created, all features functional.*

---

## Current State

MINT is a **working web application** with local AI services (Ollama, ComfyUI, Piper TTS). The backend runs on `localhost:4000` with SQLite. Frontend runs on `localhost:5173` via Vite. All AI features run locally — no cloud API keys needed for basic usage.

---

## What Works (Verified)

### Frontend
- **ThemeProvider** wraps the entire app in `main.tsx` — dark/light mode works
- **React Router**: `/` → `/app/dashboard`, `/landing` for login
- **Dev session**: hardcoded `dev-token` — no auth needed in development
- **API routing**: Vite proxy `/api` → `localhost:4000`
- **Global error display**: JS crashes show readable error instead of blank screen
- All pages: Dashboard, Projects, Studio, Research, Library, Publish — lazy loaded
- Framer Motion animations, TanStack Query caching, Toast notifications

### Backend
- **Fastify 5** with all `@fastify/*` plugins on v5-compatible versions
- **SQLite** via Prisma 6 — no external DB server needed
- **Schema auto-init**: `CREATE TABLE IF NOT EXISTS` on every startup — no `prisma migrate` needed in production
- **Dev user upsert**: ensures FK constraints are satisfied on first launch
- **Auth bypass**: dev mode auto-verifies with dummy token
- All routes: `/api/auth`, `/api/projects`, `/api/studio`, `/api/research`, `/api/library`, `/api/publish`, `/api/templates`, `/api/export`
- Health endpoint at `/health`

### Local AI Services
- **Ollama** (port 11434): Running with llama3.2 model (2GB VRAM)
- **ComfyUI** (port 8188): Installed with SD 1.5 model (~4GB VRAM)
- **Piper TTS**: Installed with en_US-amy-medium voice
- **Backend**: Configured to use all local services

### Windows Installer
- **Smart installer** (88MB): Inno Setup-based, auto-detects existing services
- **Bundles**: MINT source + Piper TTS + start/stop scripts
- **Downloads**: Ollama, ComfyUI, SD 1.5 model during setup if missing
- **Creates**: Desktop shortcut, Start Menu entry
- **Post-install**: Runs Prisma migrations and generates client

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
| framer-motion | 12.x |
| vite | 6.x |

---

## Architecture Summary

- **Frontend** → React SPA via Vite → http://localhost:5173
- **Backend** → Fastify 5 → Prisma → SQLite → http://localhost:4000
- **Auth** → Dev mode auto-verify; web mode uses magic link
- **AI** → Ollama (primary, local) → DeepSeek → OpenAI fallback
- **Images** → ComfyUI with SD 1.5 model (local, GPU-accelerated)
- **TTS** → Piper TTS (local, offline)
- **Storage** → `backend/prisma/mint.db`

See `ARCHITECTURE.md` for full data flow.

---

## Known Issues / Accepted Limitations

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| ISS-001 | No real SMTP — magic link only works in web dev mode | Low | Accepted — dev auto-verify |
| ISS-002 | Auth verify accepts any token in web dev mode | Low | Accepted — personal use |
| ISS-003 | No CSRF protection | Low | Accepted — personal use |
| ISS-004 | Node.js must be pre-installed by user | Medium | Accepted — documented in README |
| ISS-005 | ComfyUI needs NVIDIA GPU with 6GB+ VRAM | Medium | Accepted — documented |
| ISS-006 | Research is placeholder — no web search API configured | Low | Accepted — add Brave API key for research |

---

## What's Not Started / Out of Scope

| Feature | Notes |
|---------|-------|
| Real email delivery | Not needed for personal use |
| Cloud sync | Intentional — all data stays local |
| Linux / macOS builds | Not configured yet |
| Money Printer Turbo | Optional — clone and install separately |
| Docker deployment | Not maintained — focus on local development |

---

## Development Commands

```bash
# Start all services
start-mint.bat

# Web development (separate terminals)
npm run dev              # Frontend only (Vite :5173)
npm run backend:dev      # Backend only (tsx :4000)
npm run dev:all          # Both

# Build
npm run build            # TypeScript check + Vite build
npm run backend:build    # esbuild bundle + Prisma copy

# Test / Lint
npm run test
npm run lint
npm run format

# Database
npm run db:generate      # Run Prisma migrations
npm run db:studio        # Open Prisma Studio
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
| Local AI | June 2026 | Install ComfyUI, Piper TTS, configure Ollama, create start-mint.bat |
| Installer | June 2026 | Inno Setup smart installer (88MB), auto-detect AI services, desktop shortcut |
