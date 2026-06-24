# KIMI-K — MINT Personal Use Revision
## Revised Plan: Single-User, Non-SaaS Deployment
### Based on Deep Audit Report (2026-06-23)

---

# WHAT CHANGES FOR PERSONAL USE?

## 1.1 Security Threat Model — Completely Different

| Threat | SaaS Context | Personal-Use Context | Impact on Priority |
|--------|-------------|---------------------|-------------------|
| Auth bypass (SEC-001) | Attacker authenticates as any user | **You are the only user** — no attacker | 🔴→🟢 **Lower priority** |
| Custom JWT (SEC-003) | Algorithm confusion, token forgery | Same person generates and verifies tokens | 🔴→🟡 **Lower priority** |
| No rate limiting | DDoS by malicious users | No one else uses the app | 🟡→🟢 **Lower priority** |
| No CSRF protection | Cross-site request forgery | No external sites interact with your local instance | 🟡→🟢 **Lower priority** |
| No real SMTP | Users can't authenticate | You can use a simple dev token or password | 🟡→🟢 **Lower priority** |
| Missing CRUD endpoints | API incomplete | If you don't need DELETE/GET-by-ID, you don't need it | 🟡→🟢 **Optional** |
| 0% test coverage | Regressions in production | You notice regressions immediately when using | 🔴→🟡 **Lower priority** |
| Broken Dockerfile | Can't deploy to cloud | You can run `docker-compose up` locally | 🔴→🟡 **Lower priority** |

## 1.2 What DOESN'T Change (Still Critical for Personal Use)

| Issue | Why It Still Matters | Priority |
|-------|---------------------|----------|
| Duplicate route registration (BE-001) | **Breaks the app** — routes conflict, handlers fire twice | 🔴 **Still critical** |
| Missing `react-hook-form` | **Build/runtime failure** — ContentGenerator won't work | 🔴 **Still critical** |
| Research page not routed | **Feature you can't reach** | 🔴 **Still critical** |
| Library/Publish are stubs | **Features you want to use** | 🔴 **Still critical** |
| Research API double `/api` | **Research feature broken** | 🔴 **Still critical** |
| `require('fs')` in ESM | **App crashes** in strict ESM mode | 🟡 **Still high** |
| AI studio stubs (generateIdeas, generateImage) | **AI features partially broken** | 🟡 **Still high** |
| No error handling in fetchWrapper | **Silent failures** — you don't know why things break | 🟡 **Still high** |
| No token expiry check | **Session stops working** without explanation | 🟡 **Still high** |
| Dead code (AppHome.tsx, etc.) | **Confuses development** | 🟢 **Low** |

## 1.3 Features That Become IRRELEVANT for Personal Use

| Feature | SaaS Need | Personal Need | Decision |
|---------|----------|-------------|----------|
| Real SMTP email auth | Required for user registration | You know your own email | **Skip** — keep dev-only auth |
| RBAC / roles & permissions | Multi-user access control | Only you use it | **Skip** — all routes accessible |
| Password hashing / bcrypt | Secure user credentials | No external users | **Skip** — no passwords needed |
| Rate limiting | Prevent abuse | Only you | **Skip** — remove or simplify |
| Multi-tenant / team workspaces | SaaS revenue model | N/A | **Skip entirely** |
| SSO / SAML / OAuth | Enterprise onboarding | N/A | **Skip entirely** |
| API for external integrations | Third-party ecosystem | N/A | **Skip entirely** |
| Content calendar | Team coordination | Personal workflow | **Defer** — manual is fine |
| Batch generation | Team efficiency | You can run one at a time | **Defer** |
| Mobile PWA | On-the-go team | Desktop is primary | **Defer** |
| Auto-scaling / zero-downtime | Production traffic | One user, zero traffic | **Skip entirely** |
| Penetration testing / security audit | Compliance | Self-hosted tool | **Skip** |
| GDPR / PIPL compliance | Legal requirement | Personal data, no external users | **Skip** |

## 1.4 Features That Become MORE IMPORTANT for Personal Use

| Feature | Why It's More Important for Personal Use | Priority |
|---------|------------------------------------------|----------|
| **AI pipeline reliability** | This is why you're building MINT — the core value | 🔴 **Highest** |
| **Local-first / offline capability** | You don't want to depend on cloud services | 🔴 **High** |
| **Simple auth** (dev token, simple password, or no auth) | You don't need complexity for yourself | 🔴 **High** |
| **Error handling** | You need to know when things fail | 🔴 **High** |
| **Docker Compose** | One command to start everything locally | 🟡 **High** |
| **Cost monitoring** | You pay for API keys (OpenAI, DeepSeek, etc.) | 🟡 **High** |
| **Prompt tuning** | You want the best possible AI outputs | 🟡 **High** |
| **UI polish** | You use this daily — it should feel good | 🟡 **High** |
| **Library management** | Your personal content repository | 🟡 **High** |
| **Export / publish** | Getting content out to your channels | 🟡 **High** |
| **Test coverage** | Stability for daily use | 🟡 **Medium** (functional over comprehensive) |
| **Documentation** | You'll forget how you set it up | 🟢 **Medium** |

---

# PART B — REVISED SPRINT PLAN FOR PERSONAL USE

## B.1 Sprint Philosophy Shift

**For SaaS:** Security-first, compliance-first, scale-first, team-first.  
**For Personal Use:** Functionality-first, reliability-first, simplicity-first, daily-use-first.

The goal is: **"Open laptop, run one command, generate content, publish to your channels, done."**

## B.2 Revised 6-Sprint Plan (8–10 Weeks)

### Sprint 0: Fix What Breaks (Week 1)
**Goal:** The app starts, builds, and core features don't crash.

| Story | Points | Owner | Why |
|-------|--------|-------|-----|
| Fix duplicate route registration in `index.ts` | 2 | MINT-BE | App is broken without this |
| Add missing `react-hook-form` to package.json | 1 | MINT-FE | Build/runtime failure |
| Fix `require('fs')` in ESM (assembly, whisper) | 2 | MINT-BE | App crashes in ESM |
| Fix research.ts double `/api` bug | 1 | MINT-FE | Research feature broken |
| Fix Dockerfile COPY path | 2 | MINT-DB | Docker build fails |
| Fix `connectDb()` not called in `index.ts` | 1 | MINT-BE | No explicit DB connection health |
| Add missing `vitest` + `jsdom` to devDeps | 2 | MINT-DB | Test config can't run |
| Remove dead code (AppHome, Loader, AppShell) | 2 | MINT-FE | Cleanup |
| Fix Input.tsx `cn()` duplication | 1 | MINT-FE | Code quality |
| Fix tsconfig.app.json paths | 1 | MINT-FE | Misconfig |
| Add HTTP error handling to fetchWrapper | 2 | MINT-FE | Silent failures are confusing |
| Add token expiry validation to useSession | 2 | MINT-FE | Session stops working mysteriously |
| Update docs to reflect reality | 3 | MINT-DOC | You need accurate docs |

**Sprint Capacity:** 22 SP — comfortable within 30 SP target.  
**Parallel tracks:** MINT-BE (7) || MINT-FE (10) || MINT-DB (5) || MINT-DOC (3)

### Sprint 1: Make All Core Features Work (Week 2–3)
**Goal:** Every page does something useful. No stubs.

| Story | Points | Owner | Why |
|-------|--------|-------|-----|
| Wire Research page to router + sidebar | 2 | MINT-FE | Feature is unreachable |
| Complete Research page (query → AI → display results) | 5 | MINT-FE | Core feature |
| Build Library page (list saved content, CRUD) | 5 | MINT-FE | Your content repository |
| Build Publish page (queue, export, copy) | 5 | MINT-FE | Getting content out |
| Add missing GET/:id endpoints for all resources | 3 | MINT-BE | Frontend needs detail views |
| Add DELETE endpoints for all resources | 2 | MINT-BE | You need to delete things |
| Add PATCH endpoint for projects | 2 | MINT-BE | Edit projects |
| Replace localStorage library with backend-backed | 3 | MINT-FE | Data persistence |
| Fix ContentGenerator to use stores/studio.ts | 2 | MINT-FE | Consistency |
| Wire real AI provider in studio.service.ts (replace stubs) | 3 | MINT-AI | generateIdeas/image are stubs |
| Add content type icons and better UX to Studio | 2 | MINT-UX | Daily use quality |
| Fix Skeleton.tsx dark mode | 1 | MINT-FE | Dark mode polish |
| Remove unused dependencies (Zustand, Radix, lucide-react) | 2 | MINT-FE | Reduce bundle size |
| Add error states to all pages | 2 | MINT-FE | You need to know what failed |

**Sprint Capacity:** 39 SP → **Split: 20 SP Sprint 1a (Pages + Endpoints), 19 SP Sprint 1b (AI + Polish)**

**Sprint 1a (Week 2):** Router (2) + Library (5) + Publish (5) + GET/:id (3) + DELETE (2) + PATCH (2) + Error states (2) = 21 SP
**Sprint 1b (Week 3):** Research page (5) + Backend library (3) + AI stubs (3) + Studio cleanup (2) + UX (2) + Dark mode (1) + Unused deps (2) = 18 SP

### Sprint 2: AI Quality + Daily Use Polish (Week 4–5)
**Goal:** AI outputs are excellent. The UI feels good. You want to use it every day.

| Story | Points | Owner | Why |
|-------|--------|-------|-----|
| AI prompt A/B testing framework | 5 | MINT-AI | You want the best outputs |
| AI cost tracking (per request, per day, per month) | 3 | MINT-AI | You pay for API keys |
| AI content moderation (safety filter) | 3 | MINT-AI | Protect your accounts |
| Tune generateIdeas to use real AI provider | 3 | MINT-AI | Stub → real |
| Tune generateImage to use ComfyUI properly | 3 | MINT-AI | Stub → real |
| Add copy-to-clipboard with feedback for all content | 2 | MINT-FE | Daily workflow |
| Add export formats (Markdown, JSON, plain text) | 3 | MINT-FE | Flexible output |
| Add keyboard shortcuts (Ctrl+G generate, Ctrl+S save) | 2 | MINT-FE | Power user |
| Add loading skeletons to all async pages | 2 | MINT-FE | Perceived performance |
| Add toast notifications for success/error | 2 | MINT-FE | Feedback |
| Accessibility: keyboard navigation, focus traps | 3 | MINT-FE | Daily use comfort |
| Responsive design: sidebar collapse, mobile layout | 3 | MINT-FE | Use on laptop + tablet |
| Add "Recent Projects" quick access | 2 | MINT-FE | Daily workflow speed |
| Dark mode polish (consistent colors, no hardcoded) | 2 | MINT-FE | Visual comfort |
| AI provider status indicator (online/offline) | 2 | MINT-FE | Know if AI is working |

**Sprint Capacity:** 37 SP → **Split into 2 weeks (19 + 18)** or accept slight overrun.  
**KIMI-K decision:** Split into Sprint 2a (AI quality: 14 SP) and Sprint 2b (UI polish: 16 SP). Remaining 7 SP moves to Sprint 3.

### Sprint 3: Error Handling + Reliability + DevEx (Week 6–7)
**Goal:** When something breaks, you know exactly what and why. The dev environment is painless.

| Story | Points | Owner | Why |
|-------|--------|-------|-----|
| Add structured logging (Pino) with user-friendly errors | 3 | MINT-MON | Debug failures |
| Add Sentry error tracking (free tier) | 3 | MINT-MON | Catch errors you miss |
| Add circuit breaker for AI providers (fail fast) | 3 | MINT-MON | Don't hang on broken AI |
| Add `/health` endpoint with AI provider status | 2 | MINT-MON | Health check |
| Add retry logic to fetchWrapper (3× exponential backoff) | 3 | MINT-FE | Network resilience |
| Add offline indicator (backend unreachable) | 2 | MINT-FE | Know when you're offline |
| Fix CI to run actual tests (not just tsc --noEmit) | 3 | MINT-DB | Quality gate |
| Write basic unit tests for critical utilities (JWT, fetch, validation) | 5 | MINT-QA | Stability |
| Write integration tests for auth flow | 3 | MINT-QA | Auth stability |
| Write integration tests for AI generation flow | 5 | MINT-QA | AI pipeline stability |
| Add `npm run dev:all` script (starts backend + frontend in one command) | 2 | MINT-DB | Dev convenience |
| Add `.env.example` verification (script checks all required vars) | 2 | MINT-DB | Setup ease |
| Write "Getting Started" guide for personal use | 3 | MINT-DOC | You need to remember setup |
| Write AI provider configuration guide | 2 | MINT-DOC | Switch between DeepSeek/OpenAI/Ollama |

**Sprint Capacity:** 40 SP → **Split into Sprint 3a (Monitoring + Error handling: 16 SP) and Sprint 3b (Tests + DevEx: 15 SP) + carry 9 SP to Sprint 4.**

### Sprint 4: Personal Workflow Features (Week 8–9)
**Goal:** Features that make MINT a joy for your specific daily workflow.

| Story | Points | Owner | Why |
|-------|--------|-------|-----|
| Add "Favorites" or "Starred" content to Library | 3 | MINT-FE | Quick access to best work |
| Add tags/labels to content | 3 | MINT-FE | Organization |
| Add search in Library | 3 | MINT-FE | Find old content |
| Add filtering by type, date, status in Library | 3 | MINT-FE | Organization |
| Add "Duplicate" content action (clone and edit) | 2 | MINT-FE | Iterate on existing work |
| Add "Template" system (save prompts as templates) | 5 | MINT-AI | Reuse your best prompts |
| Add content history/versions (keep last 3 generations) | 3 | MINT-BE | Don't lose good work |
| Add "Publish to clipboard" with platform-specific formatting | 3 | MINT-FE | Twitter vs Instagram formatting |
| Add scheduled generation (queue content for later) | 3 | MINT-FE | Batch your workflow |
| Add dashboard/overview page (stats, recent activity) | 3 | MINT-FE | See your productivity |
| Add keyboard shortcut cheat sheet | 2 | MINT-FE | Learn shortcuts |
| AI output quality rating (thumbs up/down) | 2 | MINT-AI | Feedback for prompt tuning |
| Auto-save drafts while typing | 2 | MINT-FE | Never lose work |
| Add "Quick Generate" from sidebar (no project needed) | 2 | MINT-FE | One-off ideas |

**Sprint Capacity:** 39 SP → **Split into Sprint 4a (Library + Search: 12 SP) and Sprint 4b (Templates + Workflow: 14 SP). Remaining 13 SP to Sprint 5.**

### Sprint 5: Final Polish + Release (Week 10)
**Goal:** MINT is a tool you love using. Stable, fast, beautiful.

| Story | Points | Owner | Why |
|-------|--------|-------|-----|
| Performance audit (Lighthouse 90+) | 3 | MINT-FE | Speed matters |
| Bundle size optimization (remove unused deps, lazy loading) | 3 | MINT-FE | Fast startup |
| Animation polish (Framer Motion on page transitions, modals) | 3 | MINT-FE | Delight |
| Final accessibility pass (WCAG 2.1 AA) | 3 | MINT-FE | Inclusive |
| Color/theme consistency audit | 2 | MINT-FE | Visual polish |
| Font loading optimization (preload Inter) | 1 | MINT-FE | Speed |
| Final test pass (run all tests, fix last bugs) | 3 | MINT-QA | Stability |
| Final Docker verification (`docker-compose up` from clean) | 2 | MINT-DB | One-command startup |
| Final documentation review | 2 | MINT-DOC | Accuracy |
| Write "Daily Use Cheat Sheet" | 2 | MINT-DOC | Quick reference |
| Add demo/seed data for first-time experience | 2 | MINT-DB | See value immediately |
| Backup/export all data (JSON dump of your library) | 3 | MINT-BE | Data portability |
| Import data (JSON restore) | 2 | MINT-BE | Data portability |
| Clean up package.json (remove all unused deps) | 2 | MINT-FE | Clean slate |
| Final README with screenshots | 2 | MINT-DOC | Pride |

**Sprint Capacity:** 35 SP — **Accept slight overrun for final polish.** Or trim 5 SP (skip import, skip screenshots, skip preload).

---

## B.3 Revised Dependency Map (Personal Use)

```
Sprint 0 (Fix):
  MINT-BE (route fix) ──┬──► All features work
  MINT-BE (ESM fix) ────┤
  MINT-FE (deps) ───────┤
  MINT-FE (API bug) ────┤
  MINT-DB (Docker) ─────┤
  MINT-FE (cleanup) ────┘

Sprint 1a (Pages + Endpoints):
  MINT-BE (CRUD) ───────► MINT-FE (Library/Publish)
  MINT-FE (router) ─────► Research page reachable
  MINT-FE (backend lib) ─► Data persistence

Sprint 1b (AI):
  MINT-AI (stubs) ──────► Studio fully functional
  MINT-UX (polish) ─────► Better daily experience

Sprint 2a (AI Quality):
  MINT-AI (prompts) ────► Better outputs
  MINT-AI (cost) ───────► You know what you're spending
  MINT-AI (moderation) ─► Safe content

Sprint 2b (UI Polish):
  MINT-FE (shortcuts) ──► Power user workflow
  MINT-FE (export) ─────► Flexible output
  MINT-FE (responsive) ─► Use on any device

Sprint 3a (Reliability):
  MINT-MON (logging) ───► Debuggable
  MINT-MON (Sentry) ────► Error tracking
  MINT-MON (circuit) ───► AI resilience

Sprint 3b (DevEx + Tests):
  MINT-QA (tests) ──────► Stability
  MINT-DB (CI) ─────────► Quality gate
  MINT-DOC (guides) ────► Setup ease

Sprint 4a (Library):
  MINT-FE (search) ───────► Find content
  MINT-FE (tags) ─────────► Organization
  MINT-FE (favorites) ────► Quick access

Sprint 4b (Workflow):
  MINT-AI (templates) ─────► Reuse prompts
  MINT-FE (clipboard) ─────► Platform formatting
  MINT-FE (dashboard) ─────► Productivity view

Sprint 5 (Final):
  ALL ──► MINT-FE (performance)
  ALL ──► MINT-QA (test pass)
  ALL ──► MINT-DB (Docker verify)
  ALL ──► MINT-DOC (cheat sheet)
```

---

## B.4 Revised Risk Mitigation (Personal Use)

| Risk | Sprint | Owner | Mitigation | Priority Change |
|------|--------|-------|------------|----------------|
| Duplicate routes | 0 | MINT-BE | Remove lines 108-112 | 🔴 Unchanged (breaks app) |
| Missing deps | 0 | MINT-DB | Add to package.json | 🔴 Unchanged (breaks build) |
| Research page unreachable | 1a | MINT-FE | Add to router + sidebar | 🔴 Unchanged (feature missing) |
| Library/Publish stubs | 1a | MINT-FE | Build real pages | 🔴 Unchanged (feature missing) |
| AI studio stubs | 1b | MINT-AI | Wire real providers | 🟡 Unchanged (feature partially broken) |
| Auth bypass | — | — | **Accept for personal use** | 🔴→🟢 **Skip** (no attacker) |
| Custom JWT | — | — | **Accept for personal use** | 🔴→🟡 **Defer** (can fix later) |
| No tests | 3b | MINT-QA | Install vitest, write basic tests | 🔴→🟡 **Lower priority** |
| No real SMTP | — | — | **Accept for personal use** | 🟡→🟢 **Skip** (dev auth is fine) |
| Broken Dockerfile | 0 | MINT-DB | Fix COPY path | 🔴→🟡 **Lower priority** (can run without Docker) |
| 0% test coverage | 3b | MINT-QA | Basic coverage for critical paths | 🔴→🟡 **Lower priority** |
| No monitoring | 3a | MINT-MON | Add Sentry (free tier) | 🟡→🟡 **Same** (still useful for debugging) |
| API contract drift | — | — | **Less critical for personal use** | 🟡→🟢 **Lower priority** |
| No RBAC | — | — | **Skip entirely** | — **N/A** |
| No compliance docs | — | — | **Skip entirely** | — **N/A** |

---

## B.5 Revised Agent Scope (Personal Use)

### MINT-SEC — Scope REDUCED Dramatically

**REMOVED:**
- Fix auth bypass (not needed for personal use — you're the only user)
- Replace custom JWT (can defer — your tokens are safe from yourself)
- Wire real SMTP (not needed — dev auth is fine)
- RBAC implementation (not needed — single user)
- Password hashing (not needed — no passwords)
- Rate limiting (not needed — single user)
- Penetration testing (not needed — personal tool)
- Compliance (not needed — no external users)

**RETAINED:**
- Auth middleware (still works for your own sessions)
- JWT verification (still works, just custom — can live with it)
- Basic security headers (Helmet is already configured)
- Dependency audit (`npm audit` — still useful to know about CVEs)

**REASSIGNED TO MINT-BE:**
- Token storage for magic-link (if we ever want "real" auth, but it's optional)

### MINT-BE — Scope Unchanged (Still Busy)

**RETAINED:**
- Fix duplicate routes (still critical — breaks the app)
- Fix ESM `require('fs')` (still critical — crashes)
- Add CRUD endpoints (still needed — you need to delete/edit things)
- Connect `connectDb()` (still needed — stability)

### MINT-FE — Scope Expanded (Most Critical Agent for Personal Use)

**ADDED (for personal use quality):**
- Keyboard shortcuts
- Export formats
- Copy-to-clipboard with feedback
- Toast notifications
- Offline indicator
- AI provider status
- Tags, search, favorites in Library
- Template system
- Dashboard
- Auto-save drafts
- Quick Generate
- Performance optimization
- Animation polish
- Responsive design
- Dark mode polish

**REMOVED:**
- Complex auth flows (dev auth is fine)
- Role-based UI (not needed)
- Multi-tenant UI (not needed)

### MINT-AI — Scope Shifted (Quality Over Architecture)

**REMOVED:**
- "Build AI pipeline from scratch" (already done)
- RAG implementation (not needed for personal use)
- Fine-tuning (not needed)
- Model marketplace (not needed)

**RETAINED:**
- Fix studio stubs (generateIdeas, generateImage)
- Prompt A/B testing (you want the best outputs)
- Cost monitoring (you pay for APIs)
- Content moderation (protects your accounts)
- Template system (reuse your best prompts)
- Quality rating (feedback loop)

### MINT-DB — Scope Reduced

**REMOVED:**
- Complex CI/CD pipelines (simple is fine)
- Production deployment (Railway is optional)
- Backup strategy (you can export JSON — Sprint 5)
- Multi-region DB (not needed)

**RETAINED:**
- Fix Dockerfile (useful for local dev)
- Add test runner (useful for stability)
- Seed data (nice first-time experience)
- CI quality gate (simple lint + test)

### MINT-UX — Scope Expanded (Daily Use Quality)

**ADDED:**
- Daily workflow optimization
- Keyboard shortcut design
- Export format UX
- Dashboard design
- Personal workflow features
- Quick-access patterns

**REMOVED:**
- Enterprise onboarding (not needed)
- Team collaboration flows (not needed)
- RBAC permission UI (not needed)

### MINT-QA — Scope Reduced

**REMOVED:**
- Comprehensive test coverage (not needed for personal use)
- E2E testing (nice to have, not critical)
- Accessibility automated testing (nice to have)
- Flaky test detection (not needed)
- CI gate enforcement (simple is fine)

**RETAINED:**
- Basic unit tests for critical paths (prevents regressions)
- Auth flow tests (prevents login breakage)
- AI pipeline tests (prevents generation breakage)
- Simple test runner (useful for confidence)

### MINT-MON — Scope Reduced

**REMOVED:**
- SLO monitoring (not needed for single user)
- Metrics dashboard (not needed)
- Alerting rules (not needed — you notice when things break)
- Circuit breaker (nice to have, not critical)
- Distributed tracing (not needed)
- Performance profiling (can do manually)

**RETAINED:**
- Sentry error tracking (free tier — catches bugs you miss)
- Structured logging (useful for debugging)
- Health endpoint (already exists)
- `/health` with AI status (useful)

### MINT-DOC — Scope Shifted

**REMOVED:**
- API contract documentation (not needed — you know the API)
- OpenAPI specs (not needed)
- Cross-agent handoff docs (not needed — agents are theoretical here)
- ADRs (not needed for personal use)
- Onboarding guide for external developers (not needed)
- User manual (you know how to use it)

**RETAINED:**
- "Getting Started" guide (you'll forget setup steps)
- AI provider configuration guide (switching between DeepSeek/OpenAI/Ollama)
- "Daily Use Cheat Sheet" (keyboard shortcuts, workflow tips)
- README with screenshots (pride + reference)
- CHANGELOG (track what you built)

### KIMI-K — No Change

Orchestrator role remains. Priority shifts:
1. **Sprint 0:** Fix what breaks (functional priority)
2. **Sprint 1:** Make all features work (feature completeness)
3. **Sprint 2:** AI quality + daily use polish (delight)
4. **Sprint 3:** Reliability + debugging (stability)
5. **Sprint 4:** Personal workflow features (customization)
6. **Sprint 5:** Final polish + release (pride)

---

## B.6 Success Criteria (Personal Use)

| Criterion | Target | How You'll Know |
|-----------|--------|-----------------|
| **One-command startup** | `docker-compose up` or `npm run dev:all` starts everything | You open terminal, run one command, app works |
| **All pages functional** | No stubs. Every page does something useful | You click through every page, nothing says "coming next" |
| **AI generation works** | Text, image, voice, video all produce real output | You generate a script, it appears. You generate a voiceover, it plays. |
| **Library is useful** | Search, tags, favorites, delete | You find old content quickly |
| **Export is easy** | Copy to clipboard, download, platform-specific formatting | You generate content, copy it, paste into Instagram — it looks right |
| **Error handling** | When something fails, you know what and why | A clear error message appears, not a silent failure or a white screen |
| **Speed** | Pages load in < 1s, AI generation in < 10s | It feels snappy |
| **Dark mode** | Looks great in dark mode | You use it at night, it's comfortable |
| **Keyboard shortcuts** | You can do common tasks without mouse | Ctrl+G, Ctrl+S, etc. |
| **Cost visibility** | You know how much you're spending on API calls | A counter or log shows usage |
| **Data portability** | You can export all your content as JSON | You have a backup file |
| **No console errors** | Clean browser console | You open DevTools, no red errors |
| **Test confidence** | `npm test` passes | You run tests, they pass, you feel good |
| **Documentation** | You can set it up on a new machine in < 30 minutes | You give yourself the README, you follow it, it works |

---

## B.7 Budget & Cost Considerations (Personal Use)

| Service | Free Tier | Your Cost | Notes |
|---------|-----------|-----------|-------|
| **DeepSeek API** | No free tier | ~$0.50–$2.00 / month | Very cheap for personal use |
| **OpenAI API** | $5 free credit | $0–$5 / month | GPT-4o-mini is cheap |
| **Ollama** | Free (local) | $0 | Runs on your own machine |
| **ComfyUI** | Free (local) | $0 | Runs locally, needs GPU |
| **Edge TTS** | Free | $0 | CLI tool, no API cost |
| **MoneyPrinterTurbo** | Free (Docker) | $0 | Runs locally via Docker |
| **Pexels** | 200 requests/hour | $0 | Free tier is generous |
| **Whisper** | Free (local) | $0 | Runs locally |
| **FFmpeg** | Free | $0 | Installed locally |
| **PostgreSQL** | Free (local) | $0 | Docker or local install |
| **Railway** | $5 free credit | $0–$5 / month | Optional — can run locally |
| **Sentry** | 5,000 events/month | $0 | Free tier is sufficient |
| **TOTAL** | | **$0–$10 / month** | Very affordable for a personal tool |

**Recommendation:** Start with **Ollama (free)** for text generation, **local ComfyUI** for images, and **local MoneyPrinterTurbo** for video. Use DeepSeek/OpenAI only when you need higher quality. This keeps your monthly cost at **$0**.

---

*Revised plan generated by KIMI-K, Autonomous Orchestrator for Project MINT.*
*Context: Personal use, single-user, non-SaaS, daily workflow tool.*
*Date: 2026-06-23*
