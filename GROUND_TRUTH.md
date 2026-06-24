# GROUND_TRUTH — MINT Project

## Current State (June 2026 — Post Sprint 0)

**Functional MVP with known gaps. Sprint 0 (critical bug fixes) is complete. Sprint 1 (feature completeness) is the current priority.**

This document is the single source of truth for MINT's current state. It is updated after every sprint.

---

## What Works (Verified)

### Backend
- **Fastify 4 server**: Starts, routes requests, serves static files in production
- **Auth routes**: `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- **Project routes**: `GET /api/projects`, `POST /api/projects`
- **Research routes**: `GET /api/research`, `POST /api/research`
- **Studio routes**: 8 endpoints for text, image, voice, video, stock, assembly, transcription
- **Library routes**: `GET /api/library`, `PATCH /api/library/:id`
- **Publish routes**: `GET /api/publish`, `POST /api/publish`
- **Health endpoint**: `GET /health` returns status and timestamp
- **Error handling**: Global handler distinguishes AppError, ZodError, and unexpected errors
- **Rate limiting**: Per-route (5/min auth, 100/min API)
- **Helmet security headers**: Active (CSP disabled for dev)
- **CORS**: Configured for dev (allow all) and production (restrictive)
- **AI provider abstraction**: DeepSeek → OpenAI → Ollama fallback chain
- **ComfyUI integration**: Queue prompt, poll /history, extract image URL
- **MoneyPrinterTurbo**: Docker sidecar for video generation
- **Edge TTS**: Voiceover generation via CLI
- **Pexels API**: Stock footage search with graceful fallback
- **Whisper**: Audio transcription via CLI
- **FFmpeg assembly**: Video clip concatenation
- **PostgreSQL database**: Prisma-migrated, 4 models (User, ContentProject, GeneratedPost, ResearchReport)
- **Zod validation**: All routes have request validation schemas

### Frontend
- **React 18 + Vite 6**: Build passes, dev server works
- **React Router 7**: `/` (Landing), `/app/*` (protected shell)
- **Route guard**: Redirects unauthenticated users to `/`
- **AppLayout**: Sidebar + header + error boundary + dark/light mode toggle
- **Landing page**: Magic-link login form (dev-only auto-verify)
- **Projects page**: List + create projects (connected to backend)
- **Studio page**: ContentGenerator form with topic, type, tone selection
- **ContentGenerator**: Generates scripts, captions, thumbnails, hooks, scenarios; copy, save, voiceover, video generation
- **TanStack Query**: Server-state caching and invalidation
- **Mint theme**: CSS variables, custom components, dark/light mode
- **Responsive layout**: Works on laptop and tablet

### Infrastructure
- **Docker Compose**: postgres, backend, frontend, money-printer services
- **Dockerfiles**: Multi-stage builds for backend and frontend
- **CI/CD**: GitHub Actions runs lint, build, backend build, test
- **Test runner**: Vitest + jsdom + @testing-library/react installed
- **Environment config**: `.env.example` with 28+ variables

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

## What's Partial (Works but Incomplete)

| Feature | Status | Gap |
|---------|--------|-----|
| **Auth** | Dev-only stub | No real SMTP; verify accepts any token (acceptable for personal use) |
| **Project CRUD** | Missing endpoints | No `GET /projects/:id`, `PATCH`, `DELETE` |
| **Research** | Page exists but not routed | `Research.tsx` file exists but not in `App.tsx` router |
| **Library** | Stub page | Renders "Library coming next" — no real UI |
| **Publish** | Stub page | Renders "Publish queue coming next" — no real UI |
| **Studio AI stubs** | Partially functional | `generateIdeas` and `generateImage` in `studio.service.ts` return placeholders; actual AI provider layer beneath is fully functional |
| **Tests** | Runner installed | No actual test files written yet |
| **Documentation** | Inaccurate | `API_CONTRACT.md` documents non-existent endpoints (GET/:id, DELETE, PATCH, etc.) |

---

## What's Missing (Not Started)

| Feature | Priority | Sprint |
|---------|----------|--------|
| Real Library page (search, tags, favorites) | 🔴 High | Sprint 1a |
| Real Publish page (export, copy, queue) | 🔴 High | Sprint 1a |
| Research page wired to router | 🔴 High | Sprint 1a |
| Missing CRUD endpoints (GET/:id, PATCH, DELETE) | 🔴 High | Sprint 1a |
| AI studio stubs wired to real providers | 🟡 High | Sprint 1b |
| Keyboard shortcuts | 🟡 Medium | Sprint 2 |
| Export formats (Markdown, JSON, plain text) | 🟡 Medium | Sprint 2 |
| AI cost tracking | 🟡 Medium | Sprint 2 |
| Sentry error tracking | 🟡 Medium | Sprint 3 |
| Basic unit tests | 🟡 Medium | Sprint 3 |
| Content templates | 🟢 Low | Sprint 4 |
| Dashboard/overview | 🟢 Low | Sprint 4 |
| Performance optimization | 🟢 Low | Sprint 5 |
| Animation polish | 🟢 Low | Sprint 5 |

---

## Known Issues (Post-Sprint 0)

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| ISS-001 | Auth verify accepts any token+email | 🟡 Medium | **Accepted for personal use** — no external users |
| ISS-002 | Custom JWT implementation (not `jsonwebtoken`) | 🟡 Medium | **Accepted for personal use** — can defer |
| ISS-003 | No real SMTP | 🟡 Medium | **Accepted for personal use** — dev auth is fine |
| ISS-004 | 0% test coverage | 🟡 Medium | Planned for Sprint 3 |
| ISS-005 | API contract docs inaccurate | 🟢 Low | Planned for Sprint 0b (doc update) |
| ISS-006 | Unused dependencies (Zustand, Radix UI, lucide-react) | 🟢 Low | Planned for Sprint 1 cleanup |
| ISS-007 | `Button.tsx` lacks `displayName` | 🟢 Low | Cosmetic |
| ISS-008 | `Skeleton.tsx` hardcodes `bg-gray-200` | 🟢 Low | Dark mode issue |
| ISS-009 | No CSRF protection | 🟢 Low | **Accepted for personal use** — no external sites |
| ISS-010 | `noUnusedLocals` in tsconfig may cause strict build issues | 🟢 Low | Config issue |

---

## Architecture

See `ARCHITECTURE.md` for the full data flow diagram.

### Quick Reference
- **Frontend**: React 18 + Vite 6 + Tailwind CSS 3 + TanStack Query 5
- **Backend**: Fastify 4 + TypeScript 5.7 + Prisma 6 + Zod
- **Database**: PostgreSQL (via Prisma)
- **AI**: DeepSeek (primary) → OpenAI → Ollama (fallback)
- **Media**: ComfyUI (images), MoneyPrinterTurbo (video), Edge TTS (voice), Pexels (stock), Whisper (transcription), FFmpeg (assembly)
- **Deployment**: Docker Compose (local) + Railway (optional cloud)

---

## Development Commands

```bash
# Start everything locally
npm run backend:dev   # Terminal 1: backend on :4000
npm run dev           # Terminal 2: frontend on :5173

# Or use Docker Compose
docker-compose up     # Starts postgres, backend, frontend, money-printer

# Build
npm run build         # Frontend
npm run backend:build # Backend

# Test
npm run test          # Vitest (runner installed, tests coming in Sprint 3)

# Lint / Format
npm run lint
npm run format

# Database
npm run db:migrate    # Prisma migrate dev
npm run db:seed       # Seed data
npm run db:studio     # Prisma Studio
```

---

## Next Steps

1. **Sprint 1a**: Complete Library, Publish, and Research pages; add missing CRUD endpoints
2. **Sprint 1b**: Wire AI studio stubs to real providers
3. **Sprint 2**: AI quality tuning + daily-use polish (shortcuts, export, cost tracking)

See `KANBAN.md` for the full task board.

---

*Last updated: 2026-06-23 (Sprint 0 complete)*
*Next update: After Sprint 1a*
