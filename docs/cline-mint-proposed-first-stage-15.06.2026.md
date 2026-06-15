# MINT — Proposed First Stage Plan (15 June 2026)

## Current Phase: Early Prototype / MVP Scaffold (Phase 0)

The project has the skeleton of a content workstation: Fastify backend with Prisma + PostgreSQL, React frontend with Vite + Tailwind. But nearly every feature is a stub or placeholder, and the audit found **15 bugs** (3 critical) that would prevent runtime operation.

This plan proposes **20 tasks organized in 4 phases** to bring MINT from prototype to a functional MVP.

---

## 🔴 PHASE 1: Production Hardening (Tasks 1–6)

### Task 1: Add proper test suite
- **Priority:** 🔴 P0 — **Most important single change**
- **Effort:** 3 days
- **Why:** Currently **zero tests**. Every bug fix, new feature, or refactor has no safety net.
- **What:**
  - Backend: `vitest` + `supertest` for service and route tests
  - Frontend: `vitest` + `@testing-library/react` for component and hook tests
  - Start with: `auth.service.test.ts`, `project.service.test.ts`, `auth.routes.test.ts`
- **Success criteria:** `npm test` passes with ≥10 test cases covering core services and routes

### Task 2: Replace dev-only magic link with proper JWT auth
- **Priority:** 🔴 P0
- **Effort:** 1 day
- **Why:** Current auth uses `dev-${email}` as the "token". Anyone can forge a login by crafting `dev-admin@example.com`.
- **What:**
  - Use `@fastify/jwt` properly (already installed) for sign/verify
  - Generate real cryptographically signed tokens
  - Validate expiry on every request
- **Success criteria:** Forged tokens are rejected, real tokens work end-to-end

### Task 3: Add token expiry check + refresh flow
- **Priority:** 🔴 P0
- **Effort:** 1 day
- **Why:** `expiresAt` is stored in localStorage but never checked. Users get obscure errors.
- **What:**
  - Frontend interceptor checks expiry before each API call
  - Auto-refresh with a refresh token mechanism
  - Redirect to `/` on expiry
- **Success criteria:** Expired session redirects to landing page with a clear message

### Task 4: Run Prisma migrations & add seed data
- **Priority:** 🟠 P1
- **Effort:** 1 day
- **Why:** Schema is defined but no migrations exist.
- **What:**
  - Run `prisma migrate dev` to generate migration files
  - Create `prisma/seed.ts` with realistic demo data
  - Add `db:reset` script for quick DB teardown/rebuild
- **Success criteria:** `npm run db:migrate && npm run db:seed` produces a working database

### Task 5: Add centralized error handling middleware
- **Priority:** 🟠 P1
- **Effort:** 1 day
- **Why:** Some routes return `{ error }`, others `{ message }`, some throw, some use `reply.status()`. Inconsistent.
- **What:**
  - Create `backend/src/lib/errors.ts` with custom error classes
  - Add Fastify `setErrorHandler` that catches all thrown errors
  - Standardize response shape: `{ error: string, code?: string, details?: unknown }`
- **Success criteria:** Every route returns the same error shape on failure

### Task 6: Improve request validation formatting
- **Priority:** 🟠 P1
- **Effort:** 0.5 day
- **Why:** Returns raw zod error message string. Not useful programmatically.
- **What:**
  - Format zod errors into structured `{ field, message }` arrays
  - Return HTTP 422 (Unprocessable Entity) for validation failures
- **Success criteria:** Validation errors include field-level details

---

## 🟠 PHASE 2: Core Feature Completion (Tasks 7–12)

### Task 7: Implement real AI content generation
- **Priority:** 🟠 P1
- **Effort:** 3 days
- **Why:** **The core product feature.** Studio's `generateIdeas` returns a hardcoded placeholder.
- **What:**
  - Pick one provider (recommendation: OpenAI for fastest integration)
  - Add `openai` SDK package
  - Replace placeholder with real prompt → completion pipeline
  - Handle streaming responses if frontend supports it
- **Success criteria:** Studio page generates real content ideas using AI


### Task 8: Implement real research summarization
- **Priority:** 🟠 P1
- **Effort:** 2 days
- **Why:** Research service returns `[research placeholder]` string.
- **What:**
  - Integrate Brave Search API (env vars already defined)
  - Fetch search results for the query
  - Use AI to summarize findings into a report
- **Success criteria:** Research route returns meaningful data from real web searches

### Task 9: Implement image generation pipeline
- **Priority:** 🟠 P1
- **Effort:** 3 days
- **Why:** `generateImage` returns a placeholder `placehold.co` URL. Studio is non-functional.
- **What:**
  - Wire up OpenAI DALL-E 3 or ComfyUI
  - Handle async generation + polling for ComfyUI
  - Store generated images in S3-compatible storage
  - Return real image URLs
- **Success criteria:** Image generation produces real AI-generated images

### Task 10: Build the Publish queue with social media API integration
- **Priority:** 🟡 P2
- **Effort:** 3 days
- **Why:** `publishPost` just sets status to 'published' in DB. No actual posting.
- **What:**
  - Integrate with Twitter/X API v2 and LinkedIn API
  - Add platform-specific content validation
  - Show publish status (queued, posting, posted, failed)
- **Success criteria:** Posts can be published to real social media platforms

### Task 11: Enable real email sending
- **Priority:** 🟡 P2
- **Effort:** 0.5 day
- **Why:** `hasMailConfig` guard means magic link emails are never sent in dev.
- **What:**
  - Recommend Resend or SendGrid for easiest setup
  - Or configure local SMTP with Mailpit/MailHog for development
  - Remove the conditional guard once configured
- **Success criteria:** Magic link emails are sent and received in development

### Task 12: Build the Library page
- **Priority:** 🟡 P2
- **Effort:** 2 days
- **Why:** Shows `"Library coming next."` — one of four main product pages.
- **What:**
  - Fetch posts from `/api/library/posts`
  - Add filtering by status, platform, date
  - Add search by title/caption
  - Add batch status updates and post detail view
- **Success criteria:** Library page is fully functional with CRUD operations



---

## 🔵 PHASE 3: UX & Polish (Tasks 13–16)

### Task 13: Add loading skeletons & error states
- **Priority:** 🟡 P2
- **Effort:** 1 day
- **Why:** Currently shows plain text "Loading…" — looks unprofessional.
- **What:**
  - Create reusable `Skeleton` component with pulse animation
  - Page-level skeleton screens for all main pages
  - Error states with retry buttons
  - Empty states ("no projects yet", "no posts yet")
- **Success criteria:** All pages have proper loading, error, and empty states

### Task 14: Add toast notifications
- **Priority:** 🟡 P2
- **Effort:** 0.5 day
- **Why:** `@radix-ui/react-toast` is already a dependency but never used.
- **What:**
  - Create a `useToast` hook wrapping `@radix-ui/react-toast`
  - Show toasts on: project created, post published, error occurred
  - Auto-dismiss after 5 seconds
- **Success criteria:** Mutations show success/error toasts

### Task 15: Add responsive mobile navigation
- **Priority:** 🔵 P3
- **Effort:** 1 day
- **Why:** Sidebar is `hidden md:block` — mobile users see nothing.
- **What:**
  - Bottom navigation bar for mobile
  - Slide-out drawer for tablet
  - Keep sidebar for desktop
- **Success criteria:** App is navigable on mobile, tablet, and desktop

### Task 16: Add dark/light mode toggle
- **Priority:** 🔵 P3
- **Effort:** 0.5 day
- **Why:** CSS variables for dark mode are now defined but no toggle exists.
- **What:**
  - Respect `prefers-color-scheme` by default
  - Add manual toggle in header
  - Persist preference in localStorage
- **Success criteria:** Users can switch between dark and light modes

---

## 🟣 PHASE 4: Infrastructure & DevOps (Tasks 17–20)

### Task 17: Add Docker Compose setup
- **Priority:** 🟡 P2
- **Effort:** 1 day
- **Why:** Every new developer needs to manually install PostgreSQL and configure env vars.
- **What:**
  - `docker-compose.yml` with: PostgreSQL + Backend + Frontend
  - `Dockerfile` for backend (multi-stage)
  - `Dockerfile` for frontend (Nginx static serving)
- **Success criteria:** `docker-compose up` starts the full stack

### Task 18: Set up GitHub Actions CI
- **Priority:** 🟡 P2
- **Effort:** 0.5 day
- **Why:** No CI pipeline. Bugs can merge without detection.
- **What:**
  - Workflow: Lint → TypeScript check → Test → Build
  - Run on PR to main and push to main
  - Add status badge to README
- **Success criteria:** CI runs on every PR and blocks merge on failure

### Task 19: Add rate limiting on auth endpoints
- **Priority:** 🟠 P1
- **Effort:** 0.5 day
- **Why:** `@fastify/rate-limit` is installed but never registered. Brute-force attack vector.
- **What:**
  - Register on auth routes: 5 requests/min/IP for magic-link
  - Return 429 with Retry-After header
- **Success criteria:** Rapid auth requests are throttled

### Task 20: Add `.env` validation at startup
- **Priority:** 🟡 P2
- **Effort:** 0.5 day
- **Why:** Server starts with missing env vars and fails cryptically later.
- **What:**
  - Define required env vars in a schema
  - Validate at startup before `app.listen()`
  - Print clear error messages listing all missing vars
  - Fail with exit code 1
- **Success criteria:** Server refuses to start with clear messages when env vars are missing

---

## Summary Timeline

| Phase | Tasks | Effort | Outcome |
|-------|-------|--------|---------|
| **Phase 1: Hardening** | 1–6 | ~7 days | Tested, secure, reliable foundation |
| **Phase 2: Features** | 7–12 | ~14 days | AI features work end-to-end |
| **Phase 3: UX** | 13–16 | ~3 days | Polished, professional UI |
| **Phase 4: DevOps** | 17–20 | ~2.5 days | Deployable, monitored, scalable |

**Total estimated effort:** ~26.5 days (5–6 weeks for one developer)

---

*Proposed 15 June 2026 by Cline AI*
