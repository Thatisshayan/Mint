# MINT — Comprehensive Audit (15-Axis)

**Date:** 2026-08-10 · **Auditor seat:** Alphonso (build/CTO executor) · **Orchestrated by:** Jose
**Repo:** `D:\AgentDevWork\repos\.mint\MINT` (git repo; `D:\AgentDevWork\Mint` is the desktop build dir — excluded)
**Method:** T0 real-build verification (1 seat) + static source analysis (2 seats). Seats timed out at the *report-write* step; Jose synthesized this canonical document from their collected evidence + direct confirmation greps.
**T0 VERDICT: NOT GREEN — 0/4 gates pass.** See `2026-08-10_Alphonso_MINT_T0_Audit.md` for raw output.

---

## Severity legend
- **Critical** — blocks build/ship, leaks secrets, or is exploitable now.
- **High** — serious posture/quality issue; fix before any release.
- **Medium** — should fix soon; limited blast radius.
- **Low** — hygiene / nice-to-have.

---

## Executive summary
MINT is a **functionally rich, well-structured local-first AI studio** whose *source* is in good shape (clean Fastify 5 + Prisma modular layout, Zod-validated routes, governance docs present). However it is **currently unbuildable** from the checked-out `node_modules` (a corrupted bun reinstall left missing/fastify-unresolved packages and a corrupted `eslint-visitor-keys`). Separately, there are three security-relevant issues that matter even once the tree is healthy: **the Inno Setup installer bundles real `.env` files**, a **hardcoded JWT fallback secret + dev-token / `DISABLE_AUTH` bypass**, and **Helmet's CSP disabled**. Documentation is stale (GROUND_TRUTH last touched June). None of this is catastrophic for a personal-use app, but it must be addressed before any "all functional / shippable" claim is true.

---

## T0 — Build/Test/Lint verification (real, not green)

| Gate | Exit | First error |
|------|------|-------------|
| `npm run build` | 1 | `frontend/src/components/layout/AppShell.tsx(2,55): error TS2460: Module '"framer-motion"' declares 'Easing' locally, but it is exported as 'MotionGlobalConfig'` |
| `npm run backend:build` | 1 | `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../node_modules/destr/dist/index.mjs' imported from '.../rc9/dist/index.mjs'` |
| `npm run test` | 1 | `Error: Cannot find package '.../node_modules/@vitest/runner/node_modules/pathe/index.js' ...` |
| `npm run lint` | 2 | `Error: Invalid package config .../node_modules/eslint-visitor-keys/package.json` |

- Gates 2/3/4 are **pure `node_modules` integrity failures** — they never reached project source.
- Gate 1 reached source: **6 TS errors** — 3× framer-motion `Easing` (`AppShell.tsx:2`, `Dashboard.tsx:6`, `Projects.tsx:3`), plus `class-variance-authority` (`Button.tsx:2`), `clsx` (`lib/utils.ts:1`), `tailwind-merge` (`lib/utils.ts:2`). The latter three are type-entrypoint resolution issues (symptom of the broken tree), not clearly authored-code defects.
- **Conclusion:** Project cannot be built/tested/linted as checked out. Requires a clean reinstall (see Next Actions).

---

## Top 10 risks (prioritized)

1. **[Critical] Installer ships real `.env` secrets** — `MINT_Setup.iss:68/76`, `MINT_Setup_Lite.iss:67/71`, `MINT_Setup_Personal.iss:84` bundle `..\.env` and `..\backend\.env` into the install package. If those files hold keys, every installed copy leaks them.
2. **[Critical] Build/test/lint all fail from corrupted `node_modules`** — `fastify`/type entrypoints missing, `destr`/`pathe`/`eslint-visitor-keys` broken. Repo is not green as checked out.
3. **[High] Hardcoded JWT fallback secret** — `backend/src/config.ts:8` & `utils/jwt.ts:12` fall back to `'mint-dev-secret-change-in-production'`. Anyone running without `JWT_SECRET` gets a known key.
4. **[High] Auth bypass by design** — `DISABLE_AUTH=true` (`config.ts:9`, `auth.ts:7`, `index.ts:211`) injects a dummy user; frontend uses hardcoded `dev-token` (`Landing.tsx:17`). Acceptable for personal use but must never reach a shared deployment.
5. **[Medium] Helmet CSP disabled** — `index.ts:40` registers helmet with `contentSecurityPolicy: false`. No CSP protection on the web surface.
6. **[Medium] Permissive CORS in dev** — `index.ts:23-27` sets `origin: true` (allow-all) whenever not production/desktop. Fine for local dev; dangerous if web mode is exposed.
7. **[Medium] Documentation stale** — `GROUND_TRUTH.md` last updated June (now August); claims "all features functional / 136 tests" unverifiable because the tree won't build. Doc-freshness gate (REPO_RULES Rule 2) is violated.
8. **[Medium] Governance drift** — `scripts/gate.yml` is **untracked** (duplicate of `.github/workflows/gate.yml`, which is the live trigger; identical content). Stray untracked CI file invites divergence.
9. **[Low] Unused dependencies** — `nodemailer`, `postgres`, `bcrypt`, `@fastify/multipart` have 0 source refs. Supply-chain surface with no benefit.
10. **[Low] Placeholder/TODO debt** — `ai/index.ts:104`, `pexels.service.ts:17`, `research.service.ts:27`, `studio.service.ts:72` contain placeholder logic (research/pexels fall back to stubs when no key).

---

## 15-axis detail

### 1. Security & secrets
- **Critical** — Installer bundles `..\.env` + `..\backend\.env` (`MINT_Setup*.iss`). *Fix:* exclude `.env` from `Source:` entries; ship `.env.example` only; document that users supply keys post-install.
- **High** — JWT fallback secret (`config.ts:8`, `jwt.ts:12`). *Fix:* throw at boot if `JWT_SECRET` unset in non-dev mode.
- **High** — `DISABLE_AUTH` + `dev-token` bypass (`config.ts:9`, `auth.ts:7`, `index.ts:211`, `Landing.tsx:17`). *Fix:* gate behind desktop-only; never allow in web mode.
- **Medium** — Helmet CSP off (`index.ts:40`); CORS `origin:true` in dev (`index.ts:27`). *Fix:* enable a baseline CSP; restrict dev CORS to localhost.
- **Medium** — `.gitignore` does cover `.env` (verified: `.env` and `backend/.env` are ignored), but the *installer* re-introduces them. Also `package-lock.json`/`bun.lockb` are gitignored while a `bun.lockb` is committed in `repos/.mint/` root — inconsistent.
- **Low** — No CSRF protection (accepted for personal use per GROUND_TRUTH ISS-003). *Fix:* add if web mode is ever shared.
- No SQL/command/CSV injection found in route handlers (Prisma parameterized; Zod-validated inputs). Rate limit present in web mode (`index.ts:43-54`), disabled in desktop (acceptable).

### 2. Code quality & architecture
- Clean modular layout: `routes/` (auth, projects, studio, research, library, publish, template, export, settings), `services/` (ai/*, db, auth, library, project, publish, research, studio, template), `middleware/`, `lib/`. Consistent with `ARCHITECTURE.md`.
- **Medium** — Several `as any` casts (e.g. `helmet as any`, `fastifyStatic as any` at `index.ts:40,116`); reduces type safety. *Fix:* type the plugin options.
- **Low** — Raw `console.log/error` in `index.ts:244-249` alongside structured `lib/logger.ts`. *Fix:* route shutdown through the logger.

### 3. Test coverage & reliability
- `package.json` test script = `vitest run`; backend has 1 test (`lib/circuitBreaker.test.ts`). Frontend has `@testing-library/react` but no test files observed in the scanned set.
- **High (coverage gap)** — No tests for routes/services/auth/DB. The earlier "136 tests passing" claim (GROUND_TRUTH) is unverifiable and likely stale. *Fix:* add route-level tests for auth, export, research, studio.
- Vitest currently **cannot run** (node_modules `pathe` resolution error) — so existing tests can't even execute.

### 4. Build & CI health
- **Critical** — local build/test/lint all fail (T0). See above.
- CI: `.github/workflows/ci.yml`, `gate.yml`, `release.yml` present. `gate.yml` = secret-scan + doc-freshness + build + test + deploy-dry. The live trigger is `.github/workflows/gate.yml`; `scripts/gate.yml` is an **untracked duplicate** (identical content). *Fix:* `git rm scripts/gate.yml` or commit it deliberately.
- `backend:build` relies on `prisma generate` (postinstall was blocked by bun → `destr` failure), so the backend never bundles.

### 5. Dependency & supply-chain
- **Critical** — `node_modules` corrupted: `fastify` absent at one point, `eslint-visitor-keys/package.json` corrupted, `destr`/`rc9` + `@vitest/runner`/`pathe` broken. *Fix:* clean reinstall (`rm -rf node_modules && bun install` — requires your go-ahead for the destructive `rm`, or `bun install` in-place repair which did NOT fully fix it).
- **Low** — Unused deps: `nodemailer`, `postgres`, `bcrypt`, `@fastify/multipart` (0 refs). *Fix:* prune.
- Lockfile situation is inconsistent (see §1). `npm audit` not run (would require network/registry; deferred).
- Versions are mostly current (framer-motion 12, react 18, vite 6, prisma 6). Some majors available (vite 8, prisma 7) but not urgent.

### 6. Documentation & doc-freshness
- **Medium** — `GROUND_TRUTH.md` "Last updated: June 2026" but it is now August; claims "all features functional," "local AI working," specific test counts — none reproducible because the tree won't build. Violates REPO_RULES Rule 2 (docs with code).
- `ARCHITECTURE.md`, `REPO_DIRECTIVE.md`, `AGENTS.md`, `README.md` present and consistent with code structure.
- `docs/governance/DEFERRED_WORK.md` is empty (good hygiene).

### 7. Feature completeness vs claimed
- Claimed working: ThemeProvider, router, dev session, all pages lazy-loaded, Fastify v5 + Prisma/SQLite, local AI (Ollama/ComfyUI/Piper), Windows installer.
- Verified present in code: all routes registered, `OfflineIndicator`/`useOnlineStatus` (offline UX), Tauri config (`tauri.conf.json`), installer scripts, structured logger.
- **Placeholder gaps (real):** research returns a stub summary when no API key (`research.service.ts:27`); Pexels returns placeholder without key (`pexels.service.ts:17`); AI provider discovery falls through to placeholder (`ai/index.ts:104`). These match GROUND_TRUTH ISS-006 (research placeholder) — honestly documented, not over-claimed.
- Money Printer Turbo integration is optional (`settings.routes.ts:29`, `studio.routes.ts:126`, `video.service.ts:17`) — references `MONEY_PRINTER_URL`/`MONEY_PRINTER_BASE_URL`, localhost default.

### 8. Performance
- Frontend `dist` (June build) chunks: `index-*.js` ≈ 362 KB, `Studio-*.js` ≈ 99 KB, `index-*.css` ≈ 29 KB — reasonable, already code-split. No current bundle regen possible (build broken).
- **Low** — `frontend/src/stores/studio.ts` is 41 lines, `styles/globals.css` 163 lines — not a concern. Watch for backend `console` in hot paths once healthy.
- No N+1 confirmed in the snippets reviewed (Prisma calls are per-request). Deeper ORM profiling blocked by inability to run.

### 9. Tech debt & maintainability
- **Low** — TODO/FIXME/placeholder at `ai/index.ts:104`, `pexels.service.ts:17`, `research.service.ts:27`, `studio.service.ts:72`.
- **Low** — `as any` casts (§2). Magic numbers: rate-limit `max:100`/`1 minute` (`index.ts:46-47`) — fine, but extract to config.

### 10. Local AI integration
- Wiring present: `services/ai/ollama-discovery.ts` (settings.routes), `video.service.ts` (Money Printer), `pexels.service.ts`, `studio.service.ts`.
- Fallback chain documented as Ollama → DeepSeek → OpenAI; `LLM_PROVIDER`/`RESEARCH_PROVIDER` env-driven. `backend/.env` shows `LLM_PROVIDER=****REDACTED****` and empty `OPENAI_API_KEY` (local-first by default — good).
- **Medium** — `ai/index.ts:104` "async discovery; fall through with a placeholder" — if Ollama is down, the user may get a silent placeholder instead of a clear error. *Fix:* surface a typed failure.

### 11. Desktop / Tauri packaging
- `tauri.conf.json` present: `productName MINT`, `identifier com.mint.app`, `frontendDist ../frontend/dist`, `beforeBuildCommand: npm run backend:build && npm run build`.
- Installer: Inno Setup (`MINT_Setup.iss`, `_Lite`, `_Personal`) with `install.bat`/`install.ps1` + `installer/` (download-comfyui/download-ollama). `_Personal` is source-only (~10 MB, runs `npm install`+`prisma migrate` post-install).
- **Critical** — installers bundle `.env` (see §1). This is the single biggest desktop-packaging risk.
- Prisma sidecar / `find_node()` pattern referenced in GROUND_TRUTH (Desktop sprints) — not directly re-verified this run; flagged for a focused desktop pass once the tree builds.

### 12. Governance & compliance
- REPO_RULES v1.0.0 present; AGENTS.md pointer present; branch-only + CI gate documented.
- **Medium** — Current branch is `agent/hermes-governance-bootstrap` (governance work in flight, not merged to `main`). Tree is dirty: `scripts/gate.yml` untracked.
- Audit discipline good: `audits/` exists with dated files; this report follows the `YYYY-MM-DD_<Agent>_<Scope>_Audit.md` convention (Rule 6).
- No destructive actions taken during this audit (read-only + doc write).

### 13. Data model / DB
- Prisma + SQLite. Models: `User`, `ContentProject`, `GeneratedPost`, `ResearchReport`, `Template` (+ `MagicLinkToken` referenced). Relations present.
- **Medium** — GROUND_TRUTH describes a "schema auto-init: `CREATE TABLE IF NOT EXISTS` on every startup — no `prisma migrate` needed in production." This is a **migration-safety risk**: hand-rolled DDL drifts from the Prisma schema over time and bypasses migration history. *Fix:* use `prisma migrate deploy` in production; keep auto-init only for first-run bootstrap.
- SQLite is an acceptable choice for local-first/personal use (no external server). Note: `postgres` dep is unused (§5).

### 14. Accessibility & UX
- **Medium** — A11y annotation scan found only **1** `aria/role/label` across the frontend (transcript-observed; `aria-label`/`role` usage is minimal). Likely keyboard/AT gaps. *Fix:* audit with axe/devtools; add labels to icon buttons (`Button.tsx`, `ContentGenerator.tsx`, etc.).
- Positive: `ErrorBoundary` present (`App.tsx`), global error surface, `ToastProvider`, responsive classes observed (20 responsive usages).

### 15. Observability
- Structured logger exists (`lib/logger.ts` with levels/context), but `index.ts` uses raw `console.log/error` for shutdown (`index.ts:244-249`). *Fix:* unify on logger.
- Good: `OfflineIndicator` + `useOnlineStatus` (backend-reachability check) — real offline UX.
- No metrics/tracing beyond logs; acceptable for personal use. Health endpoint `/health` returns status/mode.

---

## Recommended next actions (in order)

1. **Clean reinstall (blocking).** `rm -rf node_modules && bun install` with the Prisma postinstall unblocked, then re-run T0. *Note: the `rm` requires your explicit go-ahead (destructive).* In-place `bun install` did NOT fully repair the tree.
2. **Fix the framer-motion `Easing` / type-entrypoint TS errors** (AppShell/Dashboard/Projects + class-variance-authority/clsx/tailwind-merge) — likely a `framer-motion` v12 + `@types` mismatch or a missing `@types/clsx`. Pin compatible versions.
3. **Stop the installer from shipping `.env`.** Remove `..\.env` / `..\backend\.env` `Source:` lines from all three `.iss` files; ship `.env.example` only.
4. **Harden auth:** throw if `JWT_SECRET` missing outside dev; restrict `DISABLE_AUTH`/`dev-token` to desktop mode only.
5. **Enable a baseline Helmet CSP** and restrict dev CORS to localhost.
6. **Refresh `GROUND_TRUTH.md`** to August with real T0 numbers; resolve the `scripts/gate.yml` untracked duplicate.
7. **Add route/service tests** (auth, export, research, studio) so "green" is measurable.
8. **Replace hand-rolled `CREATE TABLE` auto-init** with `prisma migrate deploy` in production.
9. **Prune unused deps** (nodemailer/postgres/bcrypt/@fastify/multipart) and replace `as any` casts.
10. **A11y pass** with axe; add labels to icon buttons.

---

*Prepared by Jose (orchestrator) synthesizing Alphonso-seat evidence. T0 raw output: `2026-08-10_Alphonso_MINT_T0_Audit.md`. No source was modified; no commit was made; no paid API was called.*
