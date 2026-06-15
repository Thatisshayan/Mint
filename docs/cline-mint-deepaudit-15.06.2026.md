# MINT Deep Audit Report — 15 June 2026

**Audit performed by:** Cline AI
**Commit inspected:** `63782a6` (HEAD of `main`)
**Branch:** `main`
**Remote:** `origin https://github.com/Thatisshayan/Mint.git`

---

## Executive Summary

This report documents a comprehensive line-by-line audit of the MINT codebase (backend + frontend). The project is in an **early prototype / MVP scaffold phase** — the architecture structure exists but many components are placeholders, and several **critical bugs** were found that would prevent the application from functioning at runtime.

**Total bugs found:** 15 (3 critical, 4 high, 8 medium)
**Files inspected:** 40+ across backend and frontend
**TypeScript compilation:** ✅ Both backend and frontend pass `tsc --noEmit` after fixes

---

## Phase Assessment

| Dimension | Assessment |
|-----------|-----------|
| **Architecture** | ✅ Basic structure exists (backend routes/services, frontend stores/pages) |
| **Authentication** | ⚠️ Dev-only magic links, no real email sending, no token refresh |
| **Database** | ⚠️ Schema exists but minimal, no migrations run, no seed data |
| **Core Features** | ❌ Projects & Research stubs exist, Studio & Library & Publish are placeholders |
| **AI Integration** | ❌ No actual AI calls despite env vars being defined |
| **UI/UX** | ⚠️ Basic shell exists, pages are mostly placeholder text |
| **Testing** | ❌ Zero tests (no unit, no integration, no e2e) |
| **DevOps** | ❌ No Docker, no CI/CD, no deployment config |
| **Error Handling** | ⚠️ Basic, inconsistent error patterns |
| **Security** | ❌ Dev-only JWT, no CORS hardening, no input sanitization beyond zod |

---

## 🐛 BUGS FOUND & FIXED

### 🔴 CRITICAL BUGS

#### Bug #1: Route path conflicts
- **Files:** `backend/src/routes/*.routes.ts`
- **Severity:** 🔴 CRITICAL — Runtime crash
- **Description:** All routes were mounted under `/api` prefix with **overlapping paths**. Both `projectRoutes` and `researchRoutes` registered handlers on `GET /` and `POST /`. Fastify would throw an error or silently overwrite the first handler.
- **Fix:** Namespaced all routes: `/api/projects`, `/api/research`, `/api/studio/generate`, `/api/library/posts`, `/api/publish/queue`, etc.

#### Bug #2: Frontend-backend route path mismatch (Double `/api` prefix)
- **Files:** `frontend/src/stores/*.ts`, `frontend/src/lib/api/auth.ts`
- **Severity:** 🔴 CRITICAL — All API calls fail at runtime
- **Description:** `fetchWrapper.ts` sets `API_BASE_URL = '/api'`. But stores called `/api/projects`, producing `fetch('/api/api/projects')` — double `/api` prefix.
- **Fix:** Removed `/api` from all store API paths. Stores now call `/projects` → produces `/api/projects`.

#### Bug #3: Auth routes path mismatch
- **Files:** `frontend/src/lib/api/auth.ts`
- **Severity:** 🔴 CRITICAL — Auth/login flow broken
- **Description:** Frontend called `/auth/magic-link` but backend registered `/magic-link` under `/api` prefix (`POST /api/magic-link`).
- **Fix:** Changed frontend calls from `/auth/magic-link` to `/magic-link`. |

### 🟠 HIGH-SEVERITY BUGS

#### Bug #4: Duplicate `useSession` hook
- **Files:** `frontend/src/hooks/useSession.ts`, `frontend/src/lib/api/auth.ts`
- **Severity:** 🟠 HIGH — Code confusion, potential import collisions
- **Description:** Two files defined a `useSession` hook with different implementations. The one in `auth.ts` had bugs, and `App.tsx` imported from `hooks/useSession.ts`.
- **Fix:** Removed the duplicate hook from `auth.ts`. Only `hooks/useSession.ts` is kept.

#### Bug #5: Invalid React hook usage
- **Files:** `frontend/src/lib/api/auth.ts`
- **Severity:** 🟠 HIGH — React runtime error
- **Description:** `useState(() => {...})` was called inside an `if (typeof window !== 'undefined') {}` block, violating Rules of Hooks.
- **Fix:** Removed the entire block as part of the duplicate `useSession` removal.

#### Bug #6: `RouteGuard.tsx` was a no-op
- **Files:** `frontend/src/components/RouteGuard.tsx`
- **Severity:** 🟠 HIGH — No route protection
- **Description:** The component rendered `{children}` with zero guard logic.
- **Fix:** Added redirect logic: unauthenticated users on `/app/*` routes are redirected to `/`.

#### Bug #7: Missing CSS variables
- **Files:** `frontend/src/styles/globals.css`
- **Severity:** 🟠 HIGH — Broken UI styling
- **Description:** Tailwind config referenced 12 CSS variables (`--card`, `--popover`, `--primary`, etc.) but globals.css only defined `--background` and `--foreground`.
- **Fix:** Added all missing CSS variable definitions for light and dark themes.





### 🟡 MEDIUM-SEVERITY BUGS

#### Bug #8: Missing `dotenv` dependency
- **Files:** `backend/package.json`
- **Severity:** 🟡 MEDIUM — Fragile dependency resolution
- **Description:** `backend/src/index.ts` imports `dotenv` but it was not listed in `backend/package.json`. Worked only via transitive dependency.
- **Fix:** Added `"dotenv": "^16.4.7"` to `backend/package.json`.

#### Bug #9: Inconsistent error response in publish routes
- **Files:** `backend/src/routes/publish.routes.ts`
- **Severity:** 🟡 MEDIUM — API inconsistency
- **Description:** Used `return { error: ... }` (no HTTP status) while other routes use `reply.status(400).send(...)`.
- **Fix:** Replaced with `reply.status(400).send({ error: ... })` and added `FastifyReply` import.

#### Bug #10: Unused `verify` import
- **Files:** `backend/src/services/auth.service.ts`
- **Severity:** 🟡 MEDIUM — Dead code
- **Description:** Imported `verify` from `../utils/jwt.js` but never called it.
- **Fix:** Removed unused import.

#### Bug #11: Inconsistent `db.js` import path
- **Files:** `backend/src/services/auth.service.ts`
- **Severity:** 🟡 MEDIUM — Code inconsistency
- **Description:** Used `'../services/db.js'` while all other services use `'./db.js'`.
- **Fix:** Changed to `'./db.js'`.

#### Bug #12: `console.error` instead of Fastify logger
- **Files:** `backend/src/index.ts`
- **Severity:** 🟡 MEDIUM — Lost log context
- **Description:** Used `console.error(err)` instead of `app.log.error(err)`.
- **Fix:** Replaced with `app.log.error(err)`.

#### Bug #13: No Vite proxy configured
- **Files:** `vite.config.ts`
- **Severity:** 🟡 MEDIUM — Development friction
- **Description:** Frontend dev server on port 5173 couldn't reach backend on port 4000.
- **Fix:** Added `server.proxy` config: `/api` → `http://localhost:4000`.

#### Bug #14: Placeholder `TOKEN_KEY = '***'`
- **Files:** `frontend/src/lib/api/auth.ts`, `hooks/useSession.ts`, `fetchWrapper.ts`
- **Severity:** 🟡 MEDIUM — Code smell / forgotten placeholder
- **Description:** All three files used `'***'` as the localStorage key for JWT tokens.
- **Fix:** Changed to `'mint_token'` and centralized in `auth.ts` with named exports.

#### Bug #15: `components.json` wrong CSS path

---

## ✅ FIXED ARCHITECTURE: API Route Map

| Method | Full Path | Handler | Auth | Purpose |
|--------|-----------|---------|------|---------|
| GET | `/api/health` | inline | No | Health check |
| POST | `/api/magic-link` | `sendMagicLink` | No | Send magic link email |
| POST | `/api/verify` | `verifyMagicLink` | No | Verify magic link token |
| GET | `/api/projects` | `listProjects` | Yes | List user's projects |
| POST | `/api/projects` | `createProject` | Yes | Create new project |
| GET | `/api/projects/:id` | `getProject` | Yes | Get project detail |
| GET | `/api/research` | `listResearch` | Yes | List research reports |
| POST | `/api/research` | `createResearch` | Yes | Create research query |
| POST | `/api/studio/generate` | `generateIdeas` | Yes | Generate content ideas |
| POST | `/api/studio/generate-image` | `generateImage` | Yes | Generate image |
| GET | `/api/library/posts` | `listPosts` | Yes | List library posts |
| PATCH | `/api/library/posts/:id` | `updatePost` | Yes | Update post status |
| GET | `/api/publish/queue` | `getQueue` | Yes | Get publish queue |
| POST | `/api/publish/:id` | `publishPost` | Yes | Publish a post |

---

## Remaining Issues (Not Yet Fixed)

1. **No test suite** — Zero tests across the entire codebase
2. **Auth is dev-only** — `dev-${email}` token hack, no real JWT verification
3. **AI features are placeholders** — No actual OpenAI/Anthropic/ComfyUI integration
4. **Email sending is conditional** — `hasMailConfig` guard means emails never send in dev
5. **Prisma migrations not run** — Schema exists but database connection untested
6. **No Docker/CI/CD** — No containerization or deployment pipeline
7. **`@fastify/rate-limit` installed but unused** — Auth endpoints unprotected against brute force
8. **No session expiry checking** — `expiresAt` stored but never validated on page load
9. **No error boundary in React** — Unhandled errors will white-screen the app

---

## Files Modified During Audit

**31 files changed** (including pre-existing uncommitted changes and audit fixes):

- **Backend (18):** `package.json`, `src/index.ts`, `src/middleware/auth.ts`, `src/routes/auth.routes.ts`, `src/routes/library.routes.ts`, `src/routes/projects.routes.ts`, `src/routes/publish.routes.ts`, `src/routes/research.routes.ts`, `src/routes/studio.routes.ts`, `src/services/auth.service.ts`, `src/services/db.ts`, `src/services/library.service.ts`, `src/services/project.service.ts`, `src/services/publish.service.ts`, `src/services/research.service.ts`, `src/services/studio.service.ts`, `src/utils/jwt.ts`, `tsconfig.json`
- **Frontend (11):** `src/components/RouteGuard.tsx`, `src/hooks/useSession.ts`, `src/lib/api/auth.ts`, `src/lib/api/fetchWrapper.ts`, `src/main.tsx`, `src/pages/Landing.tsx`, `src/stores/library.ts`, `src/stores/projects.ts`, `src/stores/publish.ts`, `src/stores/studio.ts`, `src/styles/globals.css`
- **Config (2):** `components.json`, `vite.config.ts`

---

*Audit completed 15 June 2026 by Cline AI*

- **Files:** `components.json`
- **Severity:** 🟡 MEDIUM — Broken shadcn/ui integration
- **Description:** Referenced `src/index.css` but actual CSS is at `frontend/src/styles/globals.css`.
- **Fix:** Corrected path.
