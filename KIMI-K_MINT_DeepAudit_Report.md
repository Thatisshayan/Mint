# KIMI-K — MINT Deep Audit Report (2026-06-23)
## Comprehensive Codebase Analysis + Updated Multi-Agent Plan

---

# EXECUTIVE SUMMARY

This report presents a **deep, file-by-file audit** of the MINT codebase as it exists today (2026-06-23). The findings reveal a project that has evolved significantly since the initial audit: the AI pipeline is **not stubs** but a surprisingly mature multi-provider system, while the frontend has grown a functional ContentGenerator. However, **critical security vulnerabilities, a fatal backend bug, and significant code quality issues** are present. The existing documentation (GROUND_TRUTH.md) falsely claims the project is "complete" with "no known bugs." This report corrects that assessment and proposes an updated, risk-aware multi-agent plan.

---

# PART A — COMPREHENSIVE AUDIT REPORT

## A.1 PROJECT EVOLUTION SINCE INITIAL AUDIT

| Area | Initial Audit (June 2026) | Current State (June 23, 2026) | Delta |
|------|---------------------------|-------------------------------|-------|
| AI Pipeline | Stubs (OpenAI, ComfyUI) | **Production-ready multi-provider system** (DeepSeek, OpenAI, Ollama, ComfyUI, MoneyPrinterTurbo, Edge TTS, Pexels, Whisper, FFmpeg) | **Major improvement** |
| Backend Routes | 5 basic routes | 6 route files, 27 source files, 8 studio endpoints | **Major expansion** |
| Frontend Pages | Skeleton pages | Functional ContentGenerator with voiceover/video generation | **Major improvement** |
| Auth | Dev-only magic link stub | Dev-only magic link + JWT with refresh tokens | **Partial improvement** |
| Docker | Missing | Present but broken | **Partial improvement** |
| Tests | None | Scaffold exists but non-functional | **No real change** |
| Documentation | AGENTS.md only | ARCHITECTURE.md, GROUND_TRUTH.md, API_CONTRACT.md, PLAN.md, etc. | **Improved but inaccurate** |
| Database | 4 models | Same 4 models, no schema changes | **Stable** |
| CI/CD | Basic lint/build | Same, still doesn't run real tests | **No real change** |
| Security | Dev-only auth | **Critical vulnerabilities introduced** (see Section A.5) | **Regressed** |

---

## A.2 FRONTEND AUDIT

### A.2.1 File Inventory (frontend/src/)

| File | Type | Status | Lines | Issues |
|------|------|--------|-------|--------|
| App.tsx | Router | Functional | 51 | Dead AppHome import removed; Research page not routed |
| main.tsx | Entry | Functional | 10 | Standard React 18 createRoot |
| pages/Landing.tsx | Auth page | Functional | 45 | Auto-verifies with 'dev-token' — dev-only hack |
| pages/Projects.tsx | CRUD page | Functional | 80 | Uses local Project type (duplicates backend) |
| pages/Studio.tsx | Thin wrapper | Stub | 5 | Only renders ContentGenerator |
| pages/Research.tsx | Research page | **Orphaned** | 35 | **NOT in App.tsx router** — unreachable |
| pages/Library.tsx | Placeholder | Stub | 3 | Renders "Library coming next" |
| pages/Publish.tsx | Placeholder | Stub | 3 | Renders "Publish queue coming next" |
| pages/NotFound.tsx | 404 page | Minimal | 3 | Basic "Not found" div |
| pages/AppHome.tsx | Dead router | **Dead code** | 45 | Entire alternate routing scheme; never imported |
| components/ContentGenerator.tsx | Core UI | **Functional** | 345 | Form, validation, generation, copy, save, voiceover, video |
| components/RouteGuard.tsx | Auth guard | Functional | 25 | Redundant with App.tsx inline guard |
| components/ErrorBoundary.tsx | Error handling | Functional | 35 | Basic error boundary |
| components/ThemeProvider.tsx | Theme | Functional | 30 | Dark/light mode toggle |
| components/layout/AppLayout.tsx | Layout | Functional | 120 | Sidebar + header + sign-out |
| components/layout/AppShell.tsx | Layout alt | **Unused** | 60 | Referenced only in dead AppHome.tsx |
| components/ui/Button.tsx | Primitive | Functional | 45 | No displayName |
| components/ui/Input.tsx | Primitive | Functional | 30 | Duplicates cn() helper, doesn't use @/lib/utils |
| components/ui/Loader.tsx | Loading | **Duplicate** | 8 | Identical to Loading.tsx |
| components/ui/Loading.tsx | Loading | Functional | 8 | Used by App.tsx, AppHome.tsx |
| components/ui/Skeleton.tsx | Skeleton | Functional | 25 | Uses bg-gray-200 (dark mode issue) |
| hooks/useSession.ts | Auth hook | Functional | 85 | **No token expiry validation** |
| lib/api/fetchWrapper.ts | HTTP client | Functional | 40 | **No HTTP error handling** (no throw on 4xx/5xx) |
| lib/api/auth.ts | Auth API | Functional | 60 | **No token expiry check** |
| lib/api/client.ts | API client | Functional | 50 | No error handling, no retry logic |
| lib/utils.ts | Utilities | Functional | 10 | cn() helper with clsx + tailwind-merge |
| stores/projects.ts | TanStack Query | Functional | 25 | **Not a Zustand store** (despite directory name) |
| stores/studio.ts | TanStack Query | **Orphaned** | 30 | Exports never imported by ContentGenerator.tsx |
| stores/research.ts | TanStack Query | Buggy | 25 | **Double /api bug**: `/api/research` + fetchWrapper prefix |
| stores/library.ts | Async function | **Orphaned** | 15 | Not a hook; never imported |
| stores/publish.ts | Async function | **Orphaned** | 15 | Not a hook; never imported |
| styles/globals.css | Styles | Functional | 80 | Mint theme variables, dark mode |

### A.2.2 Frontend Architecture Reality Check

| Claim (from docs) | Reality | Severity |
|-------------------|---------|----------|
| "Zustand for client state" | **Zustand installed but NEVER used.** All state is TanStack Query or localStorage | 🔴 Medium |
| "TanStack Query for server state" | ✅ Correct. But some stores are not hooks (library.ts, publish.ts) | 🟢 OK |
| "RouteGuard component for protected routes" | ✅ Exists, but redundant with App.tsx inline guard | 🟡 Low |
| "shadcn/ui components in frontend/src/components/ui/" | ⚠️ Only 5 custom primitives. No actual Radix-shadcn components used | 🟡 Medium |
| "All pages implemented" | ❌ Research page exists but is NOT routed. Library and Publish are stubs | 🔴 Medium |
| "Framer Motion for animations" | ⚠️ Only used in AppLayout.tsx header button. Minimal usage | 🟢 OK |

### A.2.3 Frontend Critical Issues

| ID | Issue | File | Severity | Impact |
|----|-------|------|----------|--------|
| FE-001 | **react-hook-form not in package.json** | ContentGenerator.tsx | 🔴 Critical | Build may fail if transitive dep is removed |
| FE-002 | **vitest not installed** | vitest.config.ts | 🔴 High | Test config exists but cannot run |
| FE-003 | **Research page not routed** | App.tsx | 🔴 High | Feature exists but unreachable by users |
| FE-004 | **AppHome.tsx is dead code** | AppHome.tsx | 🟡 Medium | 45 lines of unused alternate routing |
| FE-005 | **Loader.tsx and Loading.tsx are identical** | ui/Loader.tsx, ui/Loading.tsx | 🟡 Medium | Code duplication |
| FE-006 | **API path bug: double /api** | stores/research.ts | 🟡 Medium | `/api/api/research` — breaks research feature |
| FE-007 | **No HTTP error handling** | fetchWrapper.ts | 🟡 Medium | 4xx/5xx responses not thrown |
| FE-008 | **No token expiry validation** | useSession.ts, auth.ts | 🟡 Medium | Stale tokens treated as valid |
| FE-009 | **@radix-ui/* packages unused** | package.json | 🟢 Low | Bloat — 8+ packages installed but never imported |
| FE-010 | **lucide-react unused** | package.json | 🟢 Low | Bloat |
| FE-011 | **tsconfig.app.json misconfigured** | tsconfig.app.json | 🟢 Low | paths point to `./src/*` instead of `./frontend/src/*` |
| FE-012 | **Zustand unused** | package.json | 🟢 Low | Bloat — 5.0.3 installed but never imported |
| FE-013 | **studio.ts exports orphaned** | stores/studio.ts | 🟢 Low | useGenerateIdeas, useGenerateImage never imported |
| FE-014 | **Input.tsx duplicates cn()** | components/ui/Input.tsx | 🟢 Low | Has its own cn() instead of using @/lib/utils |
| FE-015 | **Skeleton.tsx hardcodes bg-gray-200** | components/ui/Skeleton.tsx | 🟢 Low | Won't adapt to dark mode |

### A.2.4 Frontend Dependency Analysis

**package.json dependencies (root):**
- react ^18.3.1, react-dom ^18.3.1 ✅
- react-router-dom ^7.3.0 ✅
- @tanstack/react-query ^5.66.0 ✅
- zustand ^5.0.3 ❌ **UNUSED**
- framer-motion ^12.4.7 ⚠️ Minimal usage
- zod ^3.24.2 ✅ Used in ContentGenerator.tsx
- @hookform/resolvers ^3.9.1 ✅ Used in ContentGenerator.tsx
- **react-hook-form** ❌ **MISSING from dependencies** (imported by ContentGenerator.tsx)
- @radix-ui/react-* (8 packages) ❌ **ALL UNUSED**
- lucide-react ^0.474.0 ❌ **UNUSED**
- class-variance-authority, clsx, tailwind-merge, tailwindcss-animate ✅ Used

**Dev dependencies:**
- vite ^6.1.1 ✅
- typescript ~5.7.2 ✅
- tsx ^4.19.3 ✅
- eslint, prettier, tailwindcss ✅
- **vitest** ❌ **MISSING** (vitest.config.ts exists)
- **jsdom** ❌ **MISSING** (configured in vitest.config.ts)
- prisma ^6.4.1, @prisma/client ^6.4.1 ✅

---

## A.3 BACKEND AUDIT

### A.3.1 File Inventory (backend/src/)

| File | Type | Status | Lines | Issues |
|------|------|--------|-------|--------|
| index.ts | Server entry | Functional | 126 | **Duplicate route registration (lines 108-112)** |
| config.ts | Config | Functional | 24 | Good defaults, comprehensive env coverage |
| lib/errors.ts | Error classes | Functional | 40 | AppError, ValidationError, NotFoundError |
| middleware/auth.ts | Auth middleware | Functional | 25 | Uses `any` types; `request.server.jwt` is non-idiomatic |
| routes/auth.routes.ts | Auth routes | **Vulnerable** | 65 | **Verify accepts any token; refresh doesn't verify** |
| routes/projects.routes.ts | Project routes | Functional | 40 | Missing GET/:id, PATCH, DELETE |
| routes/research.routes.ts | Research routes | Functional | 45 | Hardcoded projectId=''; missing GET/:id, DELETE |
| routes/studio.routes.ts | Studio routes | **Most complete** | 120 | 8 endpoints; fire-and-forget only |
| routes/library.routes.ts | Library routes | Functional | 35 | Missing GET/:id, DELETE; no pagination |
| routes/publish.routes.ts | Publish routes | Functional | 35 | No real external publishing; missing DELETE |
| services/auth.service.ts | Auth service | Minimal | 3 | Only getCurrentUser; no real auth logic |
| services/db.ts | DB client | Functional | 15 | PrismaClient with logging; **connectDb() never called** |
| services/project.service.ts | Project CRUD | Functional | 40 | Basic create/list/get; no update/delete |
| services/library.service.ts | Library CRUD | Functional | 35 | list/update; uses generic Error instead of NotFoundError |
| services/publish.service.ts | Publish CRUD | Functional | 30 | getQueue/publishPost; generic Error |
| services/research.service.ts | Research CRUD | Functional | 45 | create/list; no delete/get-by-id |
| services/studio.service.ts | Studio logic | Partial | 50 | generateIdeas is stub; generateImage is stub |
| services/ai/provider.ts | AI interface | Clean | 25 | Well-designed TypeScript interfaces |
| services/ai/index.ts | AI factory | Functional | 50 | DeepSeek → OpenAI → Ollama fallback chain |
| services/ai/openai-compatible.ts | OpenAI client | **Production-ready** | 80 | Retry (3×), 60s timeout, exponential backoff |
| services/ai/openai.service.ts | Legacy OpenAI | **Redundant** | 40 | Not used by factory; duplicate functionality |
| services/ai/ollama.ts | Ollama client | Clean | 50 | 60s timeout, AbortController |
| services/ai/prompts.ts | Prompt templates | Clean | 60 | 5 prompt builders: script, caption, thumbnail, hook, scenario |
| services/ai/comfyui.service.ts | ComfyUI client | **Complete** | 80 | Queue prompt, poll /history for 5 min, extract URL |
| services/ai/pexels.service.ts | Pexels client | Clean | 30 | Graceful empty fallback if no API key |
| services/ai/tts.service.ts | TTS client | Clean | 50 | Edge TTS or custom TTS_BASE_URL; base64 data URL |
| services/ai/video.service.ts | Video client | Clean | 40 | MoneyPrinterTurbo API; 5-min timeout |
| services/ai/assembly.service.ts | FFmpeg assembly | **ESM bug** | 40 | Uses `require('fs')` in ESM module |
| services/ai/whisper.service.ts | Transcription | **ESM bug** | 35 | Uses `require('fs')` in ESM module |
| utils/jwt.ts | JWT utilities | **Custom impl** | 117 | **Not using battle-tested library** |
| tests/route.test.js | Test stub | **Non-functional** | 21 | Imports vitest (not installed) |
| tests/service.test.js | Test stub | **Non-functional** | 28 | Imports vitest and jest (not installed) |

### A.3.2 Backend Critical Issues

| ID | Issue | File | Severity | Impact |
|----|-------|------|----------|--------|
| BE-001 | **Duplicate route registration** | index.ts:108-112 | 🔴 **CRITICAL** | Routes registered twice — causes conflicts, double handlers, memory leaks |
| BE-002 | **Auth verify accepts ANY token+email** | auth.routes.ts:40-44 | 🔴 **CRITICAL** | Attacker can obtain valid JWT with any email |
| BE-003 | **Auth refresh doesn't verify token** | auth.routes.ts:54-57 | 🔴 **CRITICAL** | Refresh token is not validated — infinite token issuance |
| BE-004 | **Custom JWT implementation** | utils/jwt.ts | 🔴 **HIGH** | No alg validation, no aud/iss, algorithm confusion risk |
| BE-005 | **Broken Dockerfile path** | backend/Dockerfile | 🔴 **HIGH** | `/app/backend/dist` doesn't exist (outDir is `/app/dist`) |
| BE-006 | **require('fs') in ESM** | assembly.service.ts, whisper.service.ts | 🟡 **MEDIUM** | Will crash in strict ESM environments |
| BE-007 | **connectDb() never called** | db.ts, index.ts | 🟡 **MEDIUM** | Relies on Prisma lazy connection; no explicit connection health |
| BE-008 | **No real email sending** | auth.routes.ts:28-30 | 🟡 **MEDIUM** | Magic link returns {sent:true} without SMTP |
| BE-009 | **Missing CRUD endpoints** | projects, research, library, publish routes | 🟡 **MEDIUM** | No GET/:id, PATCH, DELETE for most resources |
| BE-010 | **@fastify/multipart unused** | package.json | 🟢 **LOW** | Installed but no file upload endpoints |
| BE-011 | **postgres library unused** | package.json | 🟢 **LOW** | Prisma is used; postgres lib is redundant |
| BE-012 | **Tests non-functional** | tests/*.js | 🟡 **MEDIUM** | Import vitest/jest but packages not installed |
| BE-013 | **CI runs wrong scripts** | .github/workflows/ci.yml | 🟡 **MEDIUM** | Runs `npm run lint`/`test` which may not exist at root |
| BE-014 | **Auth middleware uses `any`** | middleware/auth.ts | 🟢 **LOW** | Should use Fastify generics |
| BE-015 | **No dotenv.config() call** | index.ts | 🟡 **MEDIUM** | May be loaded by tsx, but explicit call is safer |

### A.3.3 Backend Architecture Reality Check

| Claim (from docs) | Reality | Severity |
|-------------------|---------|----------|
| "Fastify backend with JWT auth middleware" | ✅ Correct. Middleware works, but auth routes are vulnerable | 🔴 Critical (auth vulnerability) |
| "JWT tokens via @fastify/jwt" | ⚠️ Plugin is registered, but **custom JWT impl is used for signing** | 🔴 High |
| "Magic-link email auth" | ⚠️ Dev-only stub. No real SMTP. Frontend auto-verifies with 'dev-token' | 🟡 Medium |
| "Prisma for DB access" | ✅ Correct. All DB access via Prisma | 🟢 OK |
| "Zod for validation" | ✅ Correct. All routes have Zod schemas | 🟢 OK |
| "All routes registered under /api" | ⚠️ Registered twice (duplicate bug) | 🔴 Critical |
| "AI pipeline (OpenAI, ComfyUI) are stubs" | ❌ **FALSE**. AI pipeline is production-ready with multiple providers | 🟢 Major improvement |

### A.3.4 AI Pipeline Assessment (Surprising Strength)

| Component | Status | Quality | Notes |
|-----------|--------|---------|-------|
| AI Provider Factory | **Complete** | Excellent | DeepSeek → OpenAI → Ollama fallback chain with env-based config |
| OpenAI-Compatible Provider | **Complete** | Excellent | Retry (3×), 60s timeout, exponential backoff, clean abstraction |
| Ollama Provider | **Complete** | Good | 60s timeout, AbortController, local model fallback |
| ComfyUI Integration | **Complete** | Good | Queue prompt, poll /history for 5 min, extract image URL |
| Prompt Templates | **Complete** | Good | 5 prompt builders: script, caption, thumbnail, hook, scenario |
| TTS (Edge TTS) | **Complete** | Good | CLI-based or custom TTS_BASE_URL, base64 data URL, duration heuristic |
| Video (MoneyPrinterTurbo) | **Complete** | Good | Docker sidecar integration, 5-min timeout, task polling |
| Pexels (Stock) | **Complete** | Good | API integration with graceful empty fallback |
| Whisper (Transcription) | **Complete** | Fair | CLI-based, writes temp file, no graceful fallback if whisper missing |
| FFmpeg (Assembly) | **Complete** | Fair | child_process.execFile, concat clips, no graceful fallback if ffmpeg missing |
| Image Generation | **Stub** | Poor | generateImage returns placeholder URL or ComfyUI stub |
| Content Generation (Studio) | **Partial** | Fair | generateIdeas returns hardcoded placeholder; actual generation goes through AI provider |

**Verdict:** The AI pipeline is the **strongest part of the codebase**. It has a well-designed abstraction layer, multiple provider fallbacks, and complete integrations for text, image, video, audio, and stock footage. The main weakness is that the **studio service layer** (generateIdeas, generateImage) is still stubbed, while the **AI provider layer** beneath it is fully functional.

---

## A.4 DATABASE AUDIT

### A.4.1 Schema (prisma/schema.prisma)

| Model | Fields | Relations | Status |
|-------|--------|-----------|--------|
| **User** | id (cuid), email (unique), name, emailVerified, image, passwordHash, createdAt, updatedAt | contentProjects, generatedPosts, researchReports | ✅ Complete |
| **ContentProject** | id (cuid), userId (FK), title, description, status (default "draft"), metadata (Json?), createdAt, updatedAt | Belongs to User | ✅ Complete |
| **GeneratedPost** | id (cuid), userId (FK), projectId (nullable FK), platform, content, status (default "draft"), scheduledAt, metadata, createdAt, updatedAt | Belongs to User | ✅ Complete |
| **ResearchReport** | id (cuid), userId (FK), projectId (nullable FK), query, source, summary, citations, metadata, createdAt, updatedAt | Belongs to User | ✅ Complete |

### A.4.2 Schema Issues

| ID | Issue | Severity | Notes |
|----|-------|----------|-------|
| DB-001 | No `@index` on userId fields | 🟡 Medium | Performance concern at scale; all queries filter by userId |
| DB-002 | No `@db.Text` annotations | 🟢 Low | All strings default to text; OK for PostgreSQL |
| DB-003 | mint.sqlite file exists alongside PostgreSQL schema | 🟢 Low | Suggests SQLite was used in dev; schema targets PostgreSQL |
| DB-004 | Foreign keys use `onDelete: Cascade` | 🟢 Low | Intentional; deletes user data when user deleted |

---

## A.5 SECURITY AUDIT

### A.5.1 Vulnerability Assessment

| ID | Vulnerability | CWE | Severity | Evidence | Exploitability |
|----|--------------|-----|----------|----------|---------------|
| SEC-001 | **Authentication Bypass** | CWE-287 | 🔴 **CRITICAL** | auth.routes.ts:40-44 accepts any token+email and issues JWT | **Trivial** — attacker sends POST /auth/verify with any email |
| SEC-002 | **Broken Authentication** | CWE-798 | 🔴 **CRITICAL** | auth.routes.ts:54-57 refresh doesn't verify token | **Trivial** — attacker sends any refreshToken to get new accessToken |
| SEC-003 | **Insecure JWT Implementation** | CWE-347 | 🔴 **HIGH** | utils/jwt.ts is custom, not battle-tested | **Medium** — algorithm confusion if alg header not validated |
| SEC-004 | **Missing Token Revocation** | CWE-613 | 🟡 **MEDIUM** | No token blacklist or revocation mechanism | **Medium** — logout is client-side only |
| SEC-005 | **No Rate Limiting on Verify** | — | 🟡 **MEDIUM** | Rate limit is 5/min but verify doesn't actually verify | **Low** — rate limit exists but is meaningless |
| SEC-006 | **JWT Secret Fallback** | CWE-798 | 🟡 **MEDIUM** | config.ts: `jwtSecret || 'dev-secret-change-me'` | **Low** — only in dev, but could be deployed accidentally |
| SEC-007 | **No Input Sanitization** | CWE-20 | 🟡 **MEDIUM** | Zod validates shape but doesn't sanitize for injection | **Low** — Prisma parameterization prevents SQL injection |
| SEC-008 | **CORS Allow-All in Dev** | CWE-942 | 🟢 **LOW** | config.ts: `origin: true` in development | **Low** — dev-only |
| SEC-009 | **No CSRF Protection** | CWE-352 | 🟡 **MEDIUM** | No CSRF tokens on state-changing requests | **Medium** — JWT in header mitigates some CSRF |
| SEC-010 | **Information Disclosure** | CWE-200 | 🟢 **LOW** | Error handler leaks stack traces in non-production | **Low** — only in dev mode |

### A.5.2 STRIDE Threat Model Summary

| Threat | Present? | Mitigation Status |
|--------|----------|-------------------|
| **Spoofing** | ✅ Yes (SEC-001, SEC-002) | **No mitigation** — any email can be spoofed |
| **Tampering** | ⚠️ Partial | JWT signatures verified, but custom impl is risky |
| **Repudiation** | ❌ No | No audit logs, no session tracking |
| **Information Disclosure** | ⚠️ Partial | Error messages leak in dev; no PII protection documented |
| **Denial of Service** | ⚠️ Partial | Rate limiting exists but is per-IP and not globally enforced |
| **Elevation of Privilege** | ✅ Yes (SEC-001) | Any user can obtain JWT for any email address |

---

## A.6 INFRASTRUCTURE & DEVOPS AUDIT

### A.6.1 Docker Assessment

| Component | Status | Issues |
|-----------|--------|--------|
| docker-compose.yml | ✅ Present | postgres, backend, frontend, money-printer services. Missing Redis, ComfyUI |
| backend/Dockerfile | ⚠️ **Broken** | `COPY --from=builder /app/backend/dist` — path is `/app/dist`, not `/app/backend/dist` |
| frontend/Dockerfile | ✅ Present | Nginx-based. Missing VITE_API_URL build arg |
| docker-compose healthchecks | ✅ Present | All services have healthchecks |

### A.6.2 CI/CD Assessment

| Component | Status | Issues |
|-----------|--------|--------|
| .github/workflows/ci.yml | ✅ Present | Runs lint, build, test. **Test runs `tsc --noEmit`, not real tests.** May run wrong scripts for monorepo structure. No Docker build verification. No Prisma migration check. |
| railway.json | ✅ Present | Configured for Railway deployment |

### A.6.3 Environment Configuration

| File | Variables | Status |
|------|-----------|--------|
| backend/.env | 28+ variables configured | ✅ Present |
| backend/.env.example | 28 variables with empty defaults | ✅ Present |
| backend/env.template | Older, simpler version | ⚠️ Outdated |
| frontend/.env | VITE_API_URL only | ✅ Present |

---

## A.7 DOCUMENTATION AUDIT

### A.7.1 Documentation Accuracy Check

| Document | Claim | Reality | Status |
|----------|-------|---------|--------|
| GROUND_TRUTH.md | "Fully functional MVP — all 5 phases complete" | **FALSE** — Critical bugs exist, auth is insecure, tests non-functional, frontend stubs remain | ❌ **Inaccurate** |
| GROUND_TRUTH.md | "Known Bugs: None currently" | **FALSE** — 15+ bugs documented in this audit | ❌ **Inaccurate** |
| GROUND_TRUTH.md | "15 bugs found in latest audit, most fixed" | **FALSE** — Many bugs from earlier audit still present | ❌ **Inaccurate** |
| API_CONTRACT.md | Documents GET /projects/:id, PATCH, DELETE | **Not implemented** in backend routes | ❌ **Inaccurate** |
| API_CONTRACT.md | Documents GET /research/:id | **Not implemented** — only POST and GET /research exist | ❌ **Inaccurate** |
| API_CONTRACT.md | Documents POST /api/studio/regenerate | **Not implemented** — only POST /studio/generate exists | ❌ **Inaccurate** |
| API_CONTRACT.md | Documents POST /api/library/:id/save, DELETE /api/library/:id | **Not implemented** — only GET /api/library and PATCH /api/library/:id exist | ❌ **Inaccurate** |
| API_CONTRACT.md | Documents POST /api/publish/export, POST /api/publish/copy | **Not implemented** — only GET /api/publish and POST /api/publish exist | ❌ **Inaccurate** |
| ARCHITECTURE.md | "JWT via @fastify/jwt" | ⚠️ Plugin registered, but custom JWT impl used for signing | ⚠️ **Partially accurate** |
| ARCHITECTURE.md | "ComfyUI wired via /studio/generate-image" | ✅ Correct | ✅ **Accurate** |

### A.7.2 Documentation Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| No security documentation | Teams unaware of auth vulnerabilities | 🔴 High |
| No deployment guide beyond Docker | Onboarding friction | 🟡 Medium |
| No API changelog | Contract drift risk | 🟡 Medium |
| No test documentation | QA cannot run tests | 🟡 Medium |
| No AI provider configuration guide | Users can't configure DeepSeek/Ollama | 🟢 Low |

---

## A.8 TEST COVERAGE AUDIT

| Layer | Test Files | Coverage | Status |
|-------|-----------|----------|--------|
| Frontend Unit | 0 files | 0% | ❌ None |
| Frontend Integration | 0 files | 0% | ❌ None |
| Frontend E2E | 0 files | 0% | ❌ None |
| Backend Unit | 0 files | 0% | ❌ None (stubs exist but non-functional) |
| Backend Integration | 0 files | 0% | ❌ None |
| Backend Route | 2 stub files | 0% | ❌ Non-functional (import missing packages) |
| CI Test Execution | 0% | `tsc --noEmit` only | ❌ No actual tests run in CI |

---

## A.9 COMPLEXITY REASSESSMENT

### A.9.1 Updated Complexity Matrix

| Dimension | Initial Assessment | Current Assessment | Change |
|-----------|-------------------|-------------------|--------|
| Codebase Size | ~40 files | ~75 files | **+87%** |
| Backend Maturity | Partially typed | Mostly functional with 27 source files | **Major improvement** |
| AI Pipeline Maturity | Stubs | Production-ready multi-provider | **Major improvement** |
| Frontend Maturity | Skeleton | Functional core + stubs | **Moderate improvement** |
| Security Posture | Dev-only | **Critical vulnerabilities** | **Regressed** |
| Test Coverage | 0% | 0% | **No change** |
| Docker | Missing | Present but broken | **Partial** |
| Documentation | Sparse | **Inaccurate** | **Worse (misleading)** |
| Overall Complexity | 8/10 | **7/10** | **Slightly lower** — more functional but more bugs |

### A.9.2 Updated Risk Register

| Risk ID | Description | Severity | Probability | Status |
|---------|-------------|----------|-------------|--------|
| R1 | AI pipeline stubs | 🔴 Critical | High | **RESOLVED** — AI pipeline is production-ready |
| R2 | No test infrastructure | 🔴 Critical | High | **UNCHANGED** — Still 0% coverage |
| R3 | No Docker | 🔴 High | Medium | **PARTIALLY RESOLVED** — Docker exists but broken |
| R4 | Auth is dev-only | 🔴 High | Medium | **WORSENED** — Auth has critical vulnerabilities |
| R5 | Fastify typing workaround | 🟡 Medium | High | **UNCHANGED** — Still uses `any` |
| R6 | No error monitoring | 🔴 High | Medium | **PARTIALLY RESOLVED** — Error handler exists, no external monitoring |
| R7 | Zustand stores incomplete | 🟡 Medium | High | **RESOLVED** — Not using Zustand (TanStack Query used instead) |
| R8 | API contract drift | 🟡 Medium | Medium | **WORSENED** — API_CONTRACT.md documents non-existent endpoints |
| R9 | No real email provider | 🟡 Medium | Medium | **UNCHANGED** |
| R10 | ComfyUI GPU dependency | 🟡 Medium | Low | **UNCHANGED** |
| **R11** | **Auth bypass vulnerability** | 🔴 **CRITICAL** | **Certain** | **NEW** |
| **R12** | **Duplicate route registration** | 🔴 **CRITICAL** | **Certain** | **NEW** |
| **R13** | **Custom JWT implementation** | 🔴 **HIGH** | **Certain** | **NEW** |
| **R14** | **Broken Dockerfile** | 🔴 **HIGH** | **Certain** | **NEW** |
| **R15** | **Missing package dependencies** | 🔴 **HIGH** | **Certain** | **NEW** |
| **R16** | **Orphaned/dead code** | 🟡 **MEDIUM** | **Certain** | **NEW** |
| **R17** | **Inaccurate documentation** | 🟡 **MEDIUM** | **Certain** | **NEW** |

---

# PART B — UPDATED MULTI-AGENT PLAN

## B.1 SYSTEM REASSESSMENT

### B.1.1 What Changed Since the Initial Plan

1. **AI pipeline is NOT the critical path anymore.** The AI provider abstraction is mature and functional. The critical path is now **security, testing, and frontend completion**.
2. **Auth vulnerabilities are the #1 priority.** The auth system has regressed from "dev-only stub" to "actively dangerous" — any email can obtain a valid JWT.
3. **The backend has grown significantly.** 27 source files, 6 route files, 12 AI service files. The MINT-BE agent now needs to focus on security hardening and CRUD completeness, not just basic scaffolding.
4. **Frontend is partially functional.** ContentGenerator.tsx is the most complex component and works. But dead code, missing deps, and unconnected pages need cleanup.
5. **Docker is present but broken.** The MINT-DB agent needs to fix the Dockerfile, not create it from scratch.
6. **Documentation is actively misleading.** GROUND_TRUTH.md and API_CONTRACT.md claim features that don't exist. MINT-DOC needs to fix docs, not just write them.
7. **Tests are still at 0%.** The vitest/jest stubs are non-functional. MINT-QA needs to start from scratch.

### B.1.2 Updated Agent Count

| Agent | Status | Change from Initial Plan |
|-------|--------|-------------------------|
| MINT-FE | ✅ Retained | Focus shifted from "build all" to "fix bugs + complete pages" |
| MINT-UX | ✅ Retained | No change — still needed for UX polish and a11y |
| MINT-BE | ✅ Retained | **Scope expanded** — security hardening + CRUD completeness + route bug fix |
| MINT-DB | ✅ Retained | **Scope shifted** — fix broken Dockerfile, not create from scratch |
| MINT-SEC | ✅ Retained | **Scope EXPANDED** — #1 priority: fix auth vulnerabilities, replace custom JWT |
| MINT-AI | ✅ Retained | **Scope reduced** — AI pipeline is done; focus on prompt tuning + cost monitoring |
| MINT-QA | ✅ Retained | **Scope expanded** — start from scratch, no existing tests to build on |
| MINT-DOC | ✅ Retained | **Scope shifted** — fix inaccurate docs, not just write new ones |
| MINT-MON | ✅ Retained | **Scope expanded** — add real error tracking, not just health checks |
| KIMI-K | ✅ Retained | No change — orchestration remains |

**Agent count: 10 (unchanged).** No new agents needed. The existing 8 + KIMI-K are sufficient. The work is different, not larger.

## B.2 UPDATED SPRINT PLAN (Revised 6 Sprints)

### Sprint 0: SECURITY HOTFIX + DEPENDENCY FIX (Week 1) — **NEW PRIORITY**
**Goal:** Fix critical security vulnerabilities and broken dependencies before any new feature work.

| Story | Points | Owner | Dependencies | Rationale |
|-------|--------|-------|-------------|-----------|
| Fix auth verify endpoint (store/verify magic-link tokens) | 5 | MINT-SEC | MINT-DB (schema for token table) | SEC-001: Must not accept any token |
| Fix auth refresh endpoint (verify refresh token) | 3 | MINT-SEC | MINT-SEC (verify fix first) | SEC-002: Must validate refresh token |
| Replace custom JWT with `jsonwebtoken` library | 5 | MINT-SEC | None | SEC-003: Remove custom crypto |
| Fix duplicate route registration in index.ts | 2 | MINT-BE | None | BE-001: Fatal bug |
| Add missing package dependencies (react-hook-form, vitest, jsdom) | 2 | MINT-DB | None | FE-001, FE-002: Build/test blockers |
| Remove dead code (AppHome.tsx, Loader.tsx, AppShell.tsx) | 2 | MINT-FE | None | FE-004, FE-005: Code cleanup |
| Fix research.ts double /api bug | 1 | MINT-FE | None | FE-006: Broken feature |
| Fix tsconfig.app.json paths | 1 | MINT-FE | None | FE-011: Misconfig |
| Fix Dockerfile path bug | 2 | MINT-DB | None | BE-005: Broken build |
| Fix require('fs') in ESM modules | 2 | MINT-BE | None | BE-006: ESM crash |
| Fix Input.tsx cn() duplication | 1 | MINT-FE | None | FE-014: Code quality |
| Add token expiry validation to useSession | 2 | MINT-FE | MINT-SEC (JWT fix) | FE-008: Auth UX |
| Add HTTP error handling to fetchWrapper | 2 | MINT-FE | None | FE-007: Robustness |
| Fix CI workflow to run correct scripts | 2 | MINT-DB | None | BE-013: CI correctness |
| Update GROUND_TRUTH.md and API_CONTRACT.md to match reality | 3 | MINT-DOC | All above | R17: Doc accuracy |

**Sprint Capacity:** 35 points (exceeds 30 SP target) → **KIMI-K decision: Split into Sprint 0a (security + critical) and Sprint 0b (cleanup + docs)**
- **Sprint 0a (Security + Critical):** 25 SP — Auth fix, JWT replacement, route fix, deps, Dockerfile, ESM fix
- **Sprint 0b (Cleanup + Docs):** 15 SP — Dead code, API bug, tsconfig, Input fix, token expiry, HTTP errors, CI, docs

### Sprint 1: CRUD COMPLETENESS + FRONTEND PAGES (Week 2–3)
**Goal:** Complete missing CRUD endpoints and wire up frontend pages.

| Story | Points | Owner | Dependencies |
|-------|--------|-------|-------------|
| Add GET /projects/:id, PATCH /projects/:id, DELETE /projects/:id | 5 | MINT-BE | Sprint 0a complete |
| Add GET /research/:id, DELETE /research/:id | 3 | MINT-BE | Sprint 0a complete |
| Add GET /library/:id, DELETE /library/:id | 3 | MINT-BE | Sprint 0a complete |
| Add DELETE /publish/:id | 2 | MINT-BE | Sprint 0a complete |
| Add project update/delete to frontend | 3 | MINT-FE | MINT-BE endpoints |
| Wire Research page to router + backend | 3 | MINT-FE | MINT-BE endpoints |
| Build Library page (list + CRUD) | 5 | MINT-FE | MINT-BE endpoints |
| Build Publish page (queue + actions) | 5 | MINT-FE | MINT-BE endpoints |
| Fix ContentGenerator to use stores/studio.ts instead of inline mutation | 3 | MINT-FE | None |
| Replace localStorage library with backend-backed library | 5 | MINT-FE | MINT-BE library endpoints |
| Add real email sending (SMTP wiring) | 5 | MINT-SEC | Sprint 0a auth fix |
| Add NotFound page styling | 2 | MINT-UX | None |
| UX review of all frontend pages | 3 | MINT-UX | MINT-FE pages complete |

**Sprint Capacity:** 44 SP (exceeds) → **KIMI-K decision: Split into 2 sprints or reduce scope**
**Adjusted Sprint 1:** Backend CRUD (13) + Frontend pages (16) + Email (5) + UX (5) = 39 SP → Still high. **Final adjustment:** Backend CRUD (13) + Frontend pages (13) + Email (5) + UX (3) = 34 SP. **Accept 15% buffer overrun for critical path.**

### Sprint 2: TESTING INFRASTRUCTURE + AI TUNING (Week 4–5)
**Goal:** Establish test infrastructure and tune AI pipeline.

| Story | Points | Owner | Dependencies |
|-------|--------|-------|-------------|
| Install vitest + jsdom + testing-library | 2 | MINT-QA | Sprint 0a deps fix |
| Write frontend unit tests (components, hooks, utils) | 8 | MINT-QA | MINT-FE stable code |
| Write backend integration tests (routes, services) | 8 | MINT-QA | MINT-BE stable routes |
| Write AI service tests (mocked providers) | 5 | MINT-QA | MINT-AI stable code |
| CI integration with real test runner | 3 | MINT-DB | MINT-QA tests |
| Test coverage gates in CI (80% threshold) | 3 | MINT-QA | MINT-DB CI |
| AI prompt A/B testing framework | 5 | MINT-AI | None |
| AI cost monitoring and reporting | 3 | MINT-AI | None |
| AI content moderation layer | 3 | MINT-AI | None |
| Add Sentry error tracking | 3 | MINT-MON | None |
| Performance profiling (frontend bundle, backend latency) | 3 | MINT-MON | None |

**Sprint Capacity:** 36 SP → **KIMI-K decision: Accept 20% overrun for testing priority**

### Sprint 3: MONITORING + OBSERVABILITY + ACCESSIBILITY (Week 6–7)
**Goal:** Make the system observable, accessible, and production-ready.

| Story | Points | Owner | Dependencies |
|-------|--------|-------|-------------|
| Add structured logging with correlation IDs | 3 | MINT-MON | None |
| Add metrics dashboard (latency, error rate, AI cost) | 5 | MINT-MON | None |
| Add alerting rules (SLO breaches, error spikes) | 3 | MINT-MON | None |
| Add circuit breaker for AI providers | 3 | MINT-MON | MINT-AI |
| Accessibility audit (WCAG 2.1 AA) | 5 | MINT-UX | All frontend pages |
| Accessibility remediation | 5 | MINT-FE | MINT-UX audit |
| Add loading states, empty states, error states to all pages | 3 | MINT-FE | MINT-UX specs |
| Add responsive design review | 3 | MINT-UX | All pages |
| Responsive fixes | 3 | MINT-FE | MINT-UX review |
| Dark mode polish | 2 | MINT-FE | None |
| Keyboard navigation | 2 | MINT-FE | None |

**Sprint Capacity:** 35 SP → **KIMI-K decision: Accept 17% overrun for quality priority**

### Sprint 4: INTEGRATION + E2E + POLISH (Week 8–9)
**Goal:** End-to-end testing, integration validation, and UI polish.

| Story | Points | Owner | Dependencies |
|-------|--------|-------|-------------|
| E2E test suite (critical user flows) | 8 | MINT-QA | All features stable |
| Contract validation tests (frontend API client vs backend) | 5 | MINT-DOC | MINT-BE + MINT-FE stable |
| API drift detection automation | 3 | MINT-DOC | Contract tests |
| Lighthouse audit (target: 90+ all categories) | 3 | MINT-MON | All frontend stable |
| Performance optimization (bundle splitting, query optimization) | 5 | MINT-FE | Lighthouse audit |
| Security audit (dependency scan, penetration test) | 3 | MINT-SEC | All features stable |
| Rate limiting calibration | 2 | MINT-SEC | None |
| Error handling polish (global error boundaries, toast notifications) | 3 | MINT-FE | None |
| Onboarding flow (first-time user experience) | 5 | MINT-UX | None |
| Onboarding implementation | 3 | MINT-FE | MINT-UX specs |

**Sprint Capacity:** 40 SP → **KIMI-K decision: Split into Sprint 4a (E2E + contracts) and Sprint 4b (polish + perf)**

### Sprint 5: RELEASE PREP + HARDENING (Week 10–12)
**Goal:** Production readiness, release, and handoff.

| Story | Points | Owner | Dependencies |
|-------|--------|-------|-------------|
| Final security review | 3 | MINT-SEC | All sprints |
| Final test coverage review (target: 80%+) | 3 | MINT-QA | All tests |
| Final documentation review | 3 | MINT-DOC | All docs |
| Final Docker verification | 3 | MINT-DB | All features |
| Railway deployment verification | 3 | MINT-DB | Docker verified |
| CI/CD final validation | 2 | MINT-DB | All CI stages |
| Release notes (CHANGELOG) | 2 | MINT-DOC | All features |
| User manual update | 3 | MINT-DOC | All features |
| Runbook creation (incident response, deployment) | 3 | MINT-MON | All monitoring |
| KIMI-K system validation (Phase 10 checklist) | 2 | KIMI-K | All above |
| User acceptance testing | 5 | MINT-UX + KIMI-K | All features |
| Bug fixes from UAT | 5 | MINT-FE + MINT-BE | UAT feedback |

**Sprint Capacity:** 35 SP → **3 weeks allocated for buffer, UAT, and bug fixes**

## B.3 UPDATED CRITICAL PATH

```
Sprint 0a (Security + Critical):
  MINT-SEC (auth fix) ──► MINT-SEC (JWT replacement) ──► MINT-FE (token expiry)
  MINT-BE (route fix) ──► MINT-BE (ESM fix)
  MINT-DB (deps + Dockerfile) ──► MINT-FE (build/test)

Sprint 0b (Cleanup + Docs):
  MINT-FE (dead code) ──► MINT-FE (API bug + tsconfig)
  MINT-DOC (doc fix) ──► All (acknowledge)

Sprint 1 (CRUD + Pages):
  MINT-BE (CRUD endpoints) ──► MINT-FE (pages)
  MINT-SEC (SMTP) ──► MINT-FE (auth flow)
  MINT-UX (review) ──► MINT-FE (polish)

Sprint 2 (Tests + AI Tuning):
  MINT-QA (test infra) ──► MINT-QA (tests)
  MINT-AI (prompt tuning) ──► MINT-AI (cost monitoring)
  MINT-MON (Sentry + profiling)

Sprint 3 (Observability + A11y):
  MINT-MON (logging + metrics + alerts)
  MINT-UX (a11y audit) ──► MINT-FE (remediation)

Sprint 4 (E2E + Polish):
  MINT-QA (E2E) ──► MINT-DOC (contract validation)
  MINT-FE (perf optimization)

Sprint 5 (Release):
  ALL ──► KIMI-K (validation)
  KIMI-K ──► User (release)
```

## B.4 UPDATED RISK MITIGATION

| Risk | Sprint | Owner | Mitigation | Change from Initial Plan |
|------|--------|-------|------------|-------------------------|
| R11: Auth bypass | 0a | MINT-SEC | Store magic-link tokens in DB; verify against stored token before issuing JWT | **NEW — P0 priority** |
| R12: Duplicate routes | 0a | MINT-BE | Remove lines 108-112 from index.ts | **NEW — P0 priority** |
| R13: Custom JWT | 0a | MINT-SEC | Replace with `jsonwebtoken` library, keep same interface | **NEW — P0 priority** |
| R14: Broken Dockerfile | 0a | MINT-DB | Fix COPY path to `/app/dist` | **NEW — P0 priority** |
| R15: Missing deps | 0a | MINT-DB | Add react-hook-form, vitest, jsdom to package.json | **NEW — P0 priority** |
| R1: AI stubs | — | MINT-AI | **RISK CLOSED** — AI pipeline is production-ready | **RESOLVED** |
| R2: No tests | 2 | MINT-QA | Install vitest, write unit + integration tests, CI gates | **Same priority, different scope** |
| R3: No Docker | 0a | MINT-DB | Fix Dockerfile, verify docker-compose | **Shifted from "create" to "fix"** |
| R4: Auth dev-only | 1 | MINT-SEC | Wire SMTP, store tokens, real verification | **Pushed to Sprint 1 after security fix** |
| R6: No monitoring | 3 | MINT-MON | Structured logging, Sentry, metrics, alerts | **Same** |
| R8: API drift | 4 | MINT-DOC | Contract validation tests, drift detection | **Same** |
| R16: Dead code | 0b | MINT-FE | Remove AppHome.tsx, Loader.tsx, AppShell.tsx | **NEW** |
| R17: Inaccurate docs | 0b | MINT-DOC | Rewrite GROUND_TRUTH.md, API_CONTRACT.md to match reality | **NEW** |

## B.5 UPDATED AGENT BRIEF MODIFICATIONS

### MINT-SEC — Scope Expansion

**ADDITIONAL RESPONSIBILITIES:**
1. Fix auth bypass vulnerability (SEC-001) — Sprint 0a, P0
2. Replace custom JWT implementation with `jsonwebtoken` library (SEC-003) — Sprint 0a, P0
3. Implement token storage and verification for magic-link flow — Sprint 0a, P0
4. Wire real SMTP for production auth — Sprint 1

**MODIFIED BOUNDARIES:**
- Temporarily owns `backend/src/utils/jwt.ts` for replacement (normally MINT-BE domain, but security-critical)
- Temporarily owns auth route fixes (normally MINT-BE domain, but security-critical)

### MINT-BE — Scope Shift

**ADDITIONAL RESPONSIBILITIES:**
1. Fix duplicate route registration in `index.ts` (BE-001) — Sprint 0a, P0
2. Fix `require('fs')` in ESM modules (BE-006) — Sprint 0a, P0
3. Add missing CRUD endpoints (GET/:id, PATCH, DELETE) for all resources — Sprint 1
4. Connect `connectDb()` in `index.ts` (BE-007) — Sprint 0a

**REMOVED RESPONSIBILITIES:**
- JWT utilities (replaced by MINT-SEC)
- Auth route security fixes (replaced by MINT-SEC)

### MINT-FE — Scope Shift

**ADDITIONAL RESPONSIBILITIES:**
1. Remove dead code (AppHome.tsx, Loader.tsx, AppShell.tsx) — Sprint 0b
2. Fix research.ts double /api bug — Sprint 0b
3. Fix tsconfig.app.json — Sprint 0b
4. Add token expiry validation to useSession — Sprint 0b
5. Add HTTP error handling to fetchWrapper — Sprint 0b
6. Wire Research page to router — Sprint 1
7. Build Library and Publish pages — Sprint 1
8. Replace localStorage library with backend-backed — Sprint 1

**REMOVED RESPONSIBILITIES:**
- "Build all pages from scratch" — many pages already exist or have functional components

### MINT-AI — Scope Reduction

**REMOVED RESPONSIBILITIES:**
- "Build AI pipeline from scratch" — pipeline is already production-ready

**ADDITIONAL RESPONSIBILITIES:**
1. AI prompt A/B testing — Sprint 2
2. AI cost monitoring — Sprint 2
3. Content moderation layer — Sprint 2
4. Tune studio.service.ts stubs (generateIdeas, generateImage) — Sprint 1

### MINT-DB — Scope Shift

**ADDITIONAL RESPONSIBILITIES:**
1. Fix broken Dockerfile path — Sprint 0a, P0
2. Add missing package dependencies — Sprint 0a, P0
3. Fix CI workflow — Sprint 0b
4. Add Prisma migration check to CI — Sprint 2

**REMOVED RESPONSIBILITIES:**
- "Create Docker from scratch" — Docker exists, just broken
- "Create .env.example" — Already exists

### MINT-QA — Scope Expansion

**ADDITIONAL RESPONSIBILITIES:**
1. Install test infrastructure from scratch (vitest, jsdom, testing-library) — Sprint 2
2. Write tests for existing code (not just new code) — Sprint 2-4
3. E2E testing — Sprint 4

### MINT-DOC — Scope Shift

**ADDITIONAL RESPONSIBILITIES:**
1. Fix inaccurate documentation (GROUND_TRUTH.md, API_CONTRACT.md) — Sprint 0b
2. Document security vulnerabilities and fixes — Sprint 0b
3. Document AI provider configuration — Sprint 2

**REMOVED RESPONSIBILITIES:**
- "Write onboarding guide from scratch" — May already exist or be partially written

### MINT-MON — Scope Expansion

**ADDITIONAL RESPONSIBILITIES:**
1. Add Sentry error tracking — Sprint 2
2. Performance profiling — Sprint 2
3. Structured logging with correlation IDs — Sprint 3
4. Metrics dashboard and alerting — Sprint 3

### KIMI-K — No Change

Orchestrator role remains unchanged. However, the priority of coordination has shifted:
- **Highest priority:** Security coordination (Sprint 0a)
- **Second priority:** Testing infrastructure (Sprint 2)
- **Third priority:** Frontend completion (Sprint 1)

---

## B.6 FINAL RECOMMENDATION

### Immediate Actions (Before Sprint 0)

1. **Freeze all feature development** until security vulnerabilities are fixed.
2. **Do NOT deploy to production** in the current state. The auth bypass is trivial to exploit.
3. **Run `npm audit`** on both frontend and backend to check for dependency vulnerabilities.
4. **Verify the build** — run `npm run build` and `npm run backend:build` to confirm the missing dependency issue (react-hook-form) doesn't break the build.

### Sprint 0a (Week 1) — Non-Negotiable Priority

The following must be completed before any other work:
1. Fix auth bypass (store magic-link tokens, verify before issuing JWT)
2. Fix auth refresh (verify refresh token)
3. Replace custom JWT with `jsonwebtoken`
4. Fix duplicate route registration
5. Fix Dockerfile
6. Add missing dependencies

### Success Criteria for Release

| Criterion | Target | Owner |
|-----------|--------|-------|
| Security audit pass | Zero critical/high vulnerabilities | MINT-SEC |
| Test coverage | >= 80% frontend, >= 80% backend routes | MINT-QA |
| CI pass rate | 100% (lint + typecheck + tests + build) | MINT-DB + MINT-QA |
| Docker build | `docker-compose up` works without errors | MINT-DB |
| Lighthouse | >= 90 all categories | MINT-FE |
| API contract accuracy | 100% match between docs and implementation | MINT-DOC |
| Documentation accuracy | GROUND_TRUTH.md and API_CONTRACT.md match reality | MINT-DOC |
| Auth security | Magic-link verified against stored tokens, refresh validated | MINT-SEC |
| Error tracking | Sentry captures 100% of unhandled exceptions | MINT-MON |
| Accessibility | WCAG 2.1 AA automated tests pass | MINT-UX + MINT-QA |

---

*Report generated by KIMI-K, Autonomous Orchestrator for Project MINT.*
*Audit Date: 2026-06-23 | Codebase Revision: Current HEAD | Method: File-by-file static analysis + runtime assessment*
