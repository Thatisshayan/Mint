# GROUND_TRUTH — MINT Project

## Current State (June 2026 — Post Sprint 5)

**Fully functional AI content workstation. All sprints complete.**

This document is the single source of truth for MINT's current state. It is updated after every sprint.

---

## What Works (Verified)

### Backend
- **Fastify 4 server**: Starts, routes requests, serves static files in production
- **Auth routes**: `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- **Project routes**: `GET /api/projects`, `POST /api/projects`, `GET /api/projects/:id`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- **Research routes**: `GET /api/research`, `POST /api/research`, `GET /api/research/:id`, `DELETE /api/research/:id`
- **Studio routes**: 10+ endpoints for text, image, voice, video, stock, assembly, transcription, ideas, AI status, cost stats, rating
- **Library routes**: `GET /api/library`, `POST /api/library`, `GET /api/library/:id`, `PATCH /api/library/:id`, `DELETE /api/library/:id`, `GET /api/library/search`, `POST /api/library/:id/toggle-favorite`
- **Publish routes**: `GET /api/publish`, `POST /api/publish`, `GET /api/publish/:id`, `DELETE /api/publish/:id`
- **Template routes**: `GET /api/templates`, `POST /api/templates`, `GET /api/templates/:id`, `DELETE /api/templates/:id`
- **Export routes**: `GET /api/export/all`, `POST /api/export/restore`
- **Health endpoint**: `GET /health` returns status and timestamp
- **Error handling**: Global handler distinguishes AppError, ZodError, and unexpected errors
- **Rate limiting**: Per-route (5/min auth, 100/min API)
- **Helmet security headers**: Active (CSP disabled for dev)
- **CORS**: Configured for dev (allow all) and production (restrictive)
- **AI provider abstraction**: DeepSeek → OpenAI → Ollama fallback chain
- **Circuit breaker**: Opens after 3 failures, recovers after 60s
- **Content moderation**: Blocks harmful content before returning
- **Cost tracking**: Logs AI usage with provider, model, tokens, cost
- **A/B testing**: Multiple prompt variations with rating system
- **ComfyUI integration**: Queue prompt, poll /history, extract image URL
- **MoneyPrinterTurbo**: Docker sidecar for video generation
- **Edge TTS**: Voiceover generation via CLI
- **Pexels API**: Stock footage search with graceful fallback
- **Whisper**: Audio transcription via CLI
- **FFmpeg assembly**: Video clip concatenation
- **PostgreSQL database**: Prisma-migrated, 5 models (User, ContentProject, GeneratedPost, ResearchReport, Template)
- **Zod validation**: All routes have request validation schemas
- **Structured logging**: Logger with correlation IDs and context

### Frontend
- **React 18 + Vite 6**: Build passes, dev server works, lazy loading enabled
- **React Router 7**: `/` (Landing), `/app/*` (protected shell) with lazy-loaded routes
- **Route guard**: Redirects unauthenticated users to `/`
- **AppLayout**: Sidebar + header + error boundary + dark/light mode toggle
- **Landing page**: Magic-link login form (dev-only auto-verify)
- **Dashboard page**: Stats, recent activity, platform breakdown, quick actions, data export
- **Projects page**: List + create projects (connected to backend)
- **Studio page**: ContentGenerator with AI status badge, cost stats, rating system, export buttons
- **ContentGenerator**: Generates scripts, captions, thumbnails, hooks, scenarios; copy, save, voiceover, video generation, auto-save drafts
- **Research page**: AI-powered research reports
- **Library page**: Full UI with search, filter by status, favorites, tags, detail modal, delete, archive
- **Publish page**: Queue management with publish, copy, remove, export JSON
- **TanStack Query**: Server-state caching and invalidation
- **Mint theme**: CSS variables, custom components, dark/light mode
- **Keyboard shortcuts**: Ctrl+G generate, Ctrl+S save, Ctrl+Shift+K shortcuts modal
- **Toast notifications**: Success, error, info, warning toasts
- **Export utilities**: Copy as Markdown, JSON, download as .txt/.md
- **Offline indicator**: Detects backend unreachability
- **Framer Motion**: Page transitions, staggered list animations

### Infrastructure
- **Docker Compose**: postgres, backend, frontend, money-printer services
- **Dockerfiles**: Multi-stage builds for backend and frontend
- **CI/CD**: GitHub Actions runs lint, build, backend build, test
- **Test runner**: Vitest + jsdom + @testing-library/react with unit tests
- **Environment config**: `.env.example` with 28+ variables
- **One-command startup**: `npm run dev:all` starts both backend and frontend

---

## What Was Fixed in Sprint 0

| Fix | File | Description |
|-----|------|-------------|
| Duplicate route registration | `backend/src/index.ts` | Removed lines 108-112 that registered projects, research, studio, library, publish routes a second time |
| ESM `require('fs')` | `assembly.service.ts`, `whisper.service.ts` | Replaced `require('fs')` with `import { ... } from 'fs/promises'` |
| Missing `react-hook-form` | `package.json` | Added to dependencies (imported by ContentGenerator.tsx) |
| Missing test runner | `package.json` | Added `vitest`, `jsdom`, `@testing-library/react` to devDependencies |
| Research API double `/api` | `frontend/src/stores/research.ts` | Changed `/api/research` to `/research` (apiClient already prefixes `/api`) |
| Dead code | `AppHome.tsx`, `Loader.tsx` | Deleted — never imported or duplicate |
| Input.tsx `cn()` duplication | `frontend/src/components/ui/Input.tsx` | Removed inline `cn()`, now imports from `@/lib/utils` |
| `tsconfig.app.json` paths | `tsconfig.app.json` | Fixed `@/*` to map to `./frontend/src/*` |
| HTTP error handling | `frontend/src/lib/api/fetchWrapper.ts` | Now throws `Error` when `!response.ok` |
| Token expiry validation | `frontend/src/hooks/useSession.ts` | Clears localStorage and returns `null` when token is expired |
| Dockerfile COPY path | `backend/Dockerfile` | Fixed `/app/backend/dist` → `/app/dist`; added frontend build stage |
| CI backend build | `.github/workflows/ci.yml` | Added `cd backend && npm run build` step |
| Explicit DB connection | `backend/src/index.ts` | Added `await connectDb()` before `app.listen()` |

---

## What's Missing (Not Started)

| Feature | Priority | Notes |
|---------|----------|-------|
| Real SMTP for auth | 🟢 Low | Accepted for personal use — dev auth is fine |
| CSRF protection | 🟢 Low | Accepted for personal use — no external sites |
| Sentry error tracking | 🟢 Low | Optional — logging is in place |
| Docker deployment | 🟢 Low | Docker Compose exists but not tested in production |

---

## Known Issues

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| ISS-001 | Auth verify accepts any token+email | 🟡 Medium | **Accepted for personal use** |
| ISS-002 | Custom JWT implementation (not `jsonwebtoken`) | 🟡 Medium | **Accepted for personal use** |
| ISS-003 | No real SMTP | 🟡 Medium | **Accepted for personal use** |
| ISS-009 | No CSRF protection | 🟢 Low | **Accepted for personal use** |

---

## Architecture

See `ARCHITECTURE.md` for the full data flow diagram.

### Quick Reference
- **Frontend**: React 18 + Vite 6 + Tailwind CSS 3 + TanStack Query 5 + Framer Motion
- **Backend**: Fastify 4 + TypeScript 5.7 + Prisma 6 + Zod
- **Database**: PostgreSQL (via Prisma) — 5 models
- **AI**: DeepSeek (primary) → OpenAI → Ollama (fallback)
- **Media**: ComfyUI (images), MoneyPrinterTurbo (video), Edge TTS (voice), Pexels (stock), Whisper (transcription), FFmpeg (assembly)
- **Deployment**: Docker Compose (local) + Railway (optional cloud)

---

## Development Commands

```bash
# Start everything locally (one command)
npm run dev:all

# Or two terminals
npm run backend:dev   # Terminal 1: backend on :4000
npm run dev           # Terminal 2: frontend on :5173

# Docker
docker-compose up

# Build
npm run build         # Frontend
npm run backend:build # Backend

# Test
npm run test          # Vitest

# Lint / Format
npm run lint
npm run format

# Database
npm run db:migrate    # Prisma migrate dev
npm run db:seed       # Seed data
npm run db:studio     # Prisma Studio
```

---

## Sprint History

| Sprint | Date | Changes |
|--------|------|---------|
| Sprint 0 | June 2026 | Fixed 14 critical bugs across backend, frontend, infra |
| Sprint 1a | June 2026 | Complete Library, Publish, Research pages; add CRUD endpoints |
| Sprint 1b | June 2026 | Wire AI studio stubs to real providers; add AI status indicator |
| Sprint 2a | June 2026 | AI prompt A/B testing, cost tracking, content moderation |
| Sprint 2b | June 2026 | Keyboard shortcuts, export formats, toast notifications, responsive design, dark mode polish |
| Sprint 3a | June 2026 | Structured logging, circuit breaker, offline indicator |
| Sprint 3b | June 2026 | Tests, CI, one-command startup, documentation |
| Sprint 4a | June 2026 | Tags, search, favorites, content templates |
| Sprint 4b | June 2026 | Dashboard, quick generate, auto-save drafts |
| Sprint 5 | June 2026 | Performance, animations, responsive, export, tests, README |

---

*Last updated: June 2026 (All sprints complete)*
