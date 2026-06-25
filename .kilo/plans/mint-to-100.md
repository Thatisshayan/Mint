# MINT — Road to 100/100

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MINT from a functional MVP into a polished, production-grade personal AI content workstation with zero lint errors, comprehensive tests, and a best-in-class daily-use experience.

**Architecture:** Fix foundational issues (lint, types, tests) first, then layer on personal-tool polish (PWA, scheduling, versioning, UX), finishing with performance and reliability hardening.

**Tech Stack:** TypeScript 5.7, React 18, Vite 6, Fastify 4, Prisma 6, PostgreSQL, TanStack Query 5, Framer Motion 12, Vitest 2

---

## Phase 0: Foundation Hygiene (Score: 64 → 72)

### Task 0.1: Fix all 92 ESLint errors

**Files:**
- Modify: `backend/src/index.ts`, `backend/src/middleware/auth.ts`, `backend/src/routes/*.routes.ts`, `backend/src/services/ai/*.ts`, `backend/src/services/auth.service.ts`, `backend/src/services/studio.service.ts`, `frontend/src/components/ContentGenerator.tsx`, `frontend/src/components/ThemeProvider.tsx`, `frontend/src/components/Toast.tsx`, `frontend/src/lib/export.ts`, `frontend/src/lib/utils.test.ts`, `frontend/src/pages/Library.tsx`, `frontend/src/pages/Publish.tsx`

- [ ] **Step 1: Remove duplicate imports**

In `frontend/src/stores/library.ts` remove the duplicate line 4 (`import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';`) and line 6 (`import { useState } from 'react';`).

- [ ] **Step 2: Fix `any` types in backend routes**

Replace all `fastify: any`, `request: any`, `reply: any` with proper Fastify types:

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/magic-link', async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
```

- [ ] **Step 3: Fix `any` types in frontend**

In `ContentGenerator.tsx` line 84-85, change `setValue('type', draft.type as any)` to proper typing using `z.infer<typeof generationFormSchema>`.

- [ ] **Step 4: Fix empty block statements**

In `assembly.service.ts`, `whisper.service.ts`: remove empty `catch {}` blocks or add a comment.

- [ ] **Step 5: Fix `require()` import**

In `costTracker.ts` line 79: replace `require()` style with ESM import.

- [ ] **Step 6: Fix no-useless-escape**

In `studio.service.ts` line 42: change `/^\d+[\.\)]\s*/` to `/^\d+[.)]\s*/`.
In `export.ts` line 6: remove unnecessary escape.

- [ ] **Step 7: Fix prefer-const**

In `export.routes.ts`: change `let restored` to `const restored`.

- [ ] **Step 8: Fix React hook deps**

In `ContentGenerator.tsx` line 88: add `addToast` and `setValue` to the useEffect dependency array, or wrap them in `useCallback`/`useRef`.

- [ ] **Step 9: Fix React refresh warnings**

Split `ThemeProvider.tsx` and `Toast.tsx` so constants are in separate files from components.

- [ ] **Step 10: Run lint**

Run: `npm run lint`
Expected: 0 errors, 0 warnings

### Task 0.2: Fix failing backend tests

**Files:**
- Modify: `backend/tests/route.test.js`, `backend/tests/service.test.js`

- [ ] **Step 1: Convert jest to vitest**

Replace all `jest.fn()` with `vi.fn()`, `jest.mock()` with `vi.mock()`, and `describe/it/expect` imports from `vitest`.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All suites pass

### Task 0.3: Remove unused dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove bloat**

Remove `zustand`, `@radix-ui/react-*` packages, and `lucide-react` from `dependencies`. They are installed but never imported.

Run: `npm run build`
Expected: Build succeeds with smaller bundle

---

## Phase 1: Test & Quality (Score: 72 → 82)

### Task 1.1: Add backend integration tests for all routes

**Files:**
- Create: `backend/tests/integration/auth.test.ts`
- Create: `backend/tests/integration/projects.test.ts`
- Create: `backend/tests/integration/studio.test.ts`
- Create: `backend/tests/integration/library.test.ts`
- Create: `backend/tests/integration/publish.test.ts`
- Create: `backend/tests/integration/research.test.ts`

- [ ] **Step 1: Write auth integration test**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/index.js';
import { prisma } from '../src/services/db.js';

describe('Auth routes', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = await buildApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /api/auth/magic-link returns sent:true', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/magic-link', payload: { email: 'test@test.com' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ sent: true, email: 'test@test.com' });
  });

  it('POST /api/auth/verify returns tokens', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { token: 'dev-token', email: 'test@test.com' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeDefined();
  });
});
```

- [ ] **Step 2: Write projects integration test**

Test CRUD: create project, list projects, get project, update project, delete project.

- [ ] **Step 3: Write library integration test**

Test create post, list with pagination, search, update, toggle favorite, delete.

- [ ] **Step 4: Write studio integration test**

Test generate with mock AI provider, generate-image placeholder, rate prompt.

- [ ] **Step 5: Write publish integration test**

Test queue, publish, delete.

- [ ] **Step 6: Write research integration test**

Test create research, list, get, delete.

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: All integration tests pass

### Task 1.2: Add frontend component tests

**Files:**
- Create: `frontend/src/components/__tests__/ContentGenerator.test.tsx`
- Create: `frontend/src/components/__tests__/Library.test.tsx`
- Create: `frontend/src/components/__tests__/Dashboard.test.tsx`

- [ ] **Step 1: Write ContentGenerator test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentGenerator } from '../ContentGenerator';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ContentGenerator', () => {
  it('renders the generate form', () => {
    render(<ContentGenerator />, { wrapper });
    expect(screen.getByPlaceholderText(/AI tools/)).toBeDefined();
    expect(screen.getByRole('button', { name: /generate/i })).toBeDefined();
  });

  it('shows validation error for empty topic', async () => {
    render(<ContentGenerator />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(screen.getByText(/Topic must be at least 3 characters/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Write Library test**

Test renders list, filter buttons, search input, and detail modal.

- [ ] **Step 3: Write Dashboard test**

Test renders stats, quick actions, and handles export.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All component tests pass

### Task 1.3: Add E2E smoke test with Playwright

**Files:**
- Create: `frontend/e2e/auth.spec.ts`
- Create: `frontend/e2e/studio.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write auth smoke test**

```typescript
import { test, expect } from '@playwright/test';

test('landing page login flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="email"]', 'test@test.com');
  await page.click('button:has-text("Launch Mint")');
  await expect(page).toHaveURL('/app/dashboard');
});
```

- [ ] **Step 3: Write studio smoke test**

Test generate content flow end-to-end.

- [ ] **Step 4: Run E2E**

Run: `npx playwright test`
Expected: Both specs pass

---

## Phase 2: Core UX Polish (Score: 82 → 90)

### Task 2.1: Replace hardcoded userId with real session

**Files:**
- Modify: `frontend/src/components/ContentGenerator.tsx`, `frontend/src/hooks/useSession.ts`

- [ ] **Step 1: Add userId to Session type**

Update `Session` type to include `user: { id: string; email: string; name?: string }`.

- [ ] **Step 2: Wire userId from session in ContentGenerator**

Replace `const userId = 'default-user';` with `const { session } = useSession(); const userId = session?.user?.id || 'anonymous';`.

- [ ] **Step 3: Fix Research page demo-project**

Replace `const [projectId] = useState('demo-project');` with a project selector dropdown or use the first available project.

- [ ] **Step 4: Verify**

Run: `npm run dev`
Manual: Login, generate content, verify it saves to library under your user.

### Task 2.2: Extract ContentGenerator into smaller components

**Files:**
- Create: `frontend/src/components/Studio/GenerationForm.tsx`
- Create: `frontend/src/components/Studio/ResultPanel.tsx`
- Create: `frontend/src/components/Studio/ActionPanel.tsx`
- Modify: `frontend/src/components/ContentGenerator.tsx`

- [ ] **Step 1: Extract GenerationForm**

Move the form (inputs + submit button) into `GenerationForm.tsx` with props `onSubmit`, `isSubmitting`.

- [ ] **Step 2: Extract ResultPanel**

Move the result display (pre/edit, copy, rate) into `ResultPanel.tsx` with props `selectedItem`, `isEditing`, etc.

- [ ] **Step 3: Extract ActionPanel**

Move the "Next actions" sidebar buttons into `ActionPanel.tsx` with props for all the handlers.

- [ ] **Step 4: Compose in ContentGenerator**

Import the three sub-components and wire them up.

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: Build succeeds, UI unchanged.

### Task 2.3: Implement content scheduling

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/services/publish.service.ts`
- Modify: `backend/src/routes/publish.routes.ts`
- Modify: `frontend/src/pages/Publish.tsx`

- [ ] **Step 1: Add scheduling endpoint**

In `publish.routes.ts`, add `PATCH /publish/:id/schedule` that accepts `{ scheduledAt: string }`.

- [ ] **Step 2: Update publish service**

Add `schedulePost(userId, id, scheduledAt)` that updates `scheduledAt` field.

- [ ] **Step 3: Update Publish page UI**

Add datetime-local input to schedule a post.

- [ ] **Step 4: Run build and test**

Run: `npm run build && npm test`

### Task 2.4: Implement undo/soft-delete for library

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/services/library.service.ts`
- Modify: `backend/src/routes/library.routes.ts`
- Modify: `frontend/src/pages/Library.tsx`

- [ ] **Step 1: Add deletedAt to schema**

Add `deletedAt DateTime?` to `GeneratedPost` model.

- [ ] **Step 2: Update delete methods**

Change `deletePost` to soft-delete (`update({ data: { deletedAt: new Date() } })`).

- [ ] **Step 3: Add restore endpoint**

Add `POST /library/:id/restore` that clears `deletedAt`.

- [ ] **Step 4: Update Library UI**

Add "Restore" button for archived items, and a "Deleted" filter tab.

- [ ] **Step 5: Run build and test**

### Task 2.5: Add template picker in Studio

**Files:**
- Modify: `frontend/src/components/Studio/GenerationForm.tsx`
- Modify: `frontend/src/stores/templates.ts`

- [ ] **Step 1: Add template dropdown**

Add a "Templates" select above the form that loads template name + topic + tone.

- [ ] **Step 2: Wire to templates store**

Fetch user templates and populate form when selected.

- [ ] **Step 3: Verify**

Run: `npm run dev`

### Task 2.6: Add PWA support

**Files:**
- Create: `frontend/public/manifest.json`
- Create: `frontend/src/sw.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Create manifest**

Add `manifest.json` with name, icons, theme colors, display: standalone.

- [ ] **Step 2: Add service worker**

Basic cache-first strategy for static assets.

- [ ] **Step 3: Register SW in main.tsx**

Add `navigator.serviceWorker.register('/sw.ts')`.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Manual: Check Application tab for SW registration.

---

## Phase 3: Reliability & Data (Score: 90 → 95)

### Task 3.1: Replace custom JWT with `jsonwebtoken`

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/src/utils/jwt.ts`
- Modify: `backend/src/middleware/auth.ts`
- Modify: `backend/src/routes/auth.routes.ts`

- [ ] **Step 1: Install jsonwebtoken**

```bash
cd backend && npm install jsonwebtoken && npm install -D @types/jsonwebtoken
```

- [ ] **Step 2: Rewrite jwt.ts**

Replace custom implementation with `jwt.sign()` and `jwt.verify()` from `jsonwebtoken`.

- [ ] **Step 3: Update imports**

Update all files importing from `../utils/jwt` to use the new API.

- [ ] **Step 4: Verify**

Run: `npm run backend:build`
Run: `npm test`

### Task 3.2: Add real token verification for magic links

**Files:**
- Modify: `backend/src/routes/auth.routes.ts`
- Modify: `backend/src/services/auth.service.ts`

- [ ] **Step 1: Store magic-link tokens**

Add `magicLinkToken: String?`, `magicLinkExpires: DateTime?` to User model.

- [ ] **Step 2: Generate and store token on send**

In `magic-link` route: generate random token, store with 15min expiry, return only email (not token).

- [ ] **Step 3: Verify against stored token**

In `verify` route: look up user by email, check token matches and hasn't expired.

- [ ] **Step 4: Add env var for SMTP or keep dev flow**

For personal use, keep the dev flow but verify stored tokens.

- [ ] **Step 5: Run tests**

### Task 3.3: Add graceful shutdown

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Add signal handlers**

```typescript
process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down gracefully');
  await app.close();
  await disconnectDb();
  process.exit(0);
});

process.on('SIGINT', async () => {
  app.log.info('SIGINT received, shutting down gracefully');
  await app.close();
  await disconnectDb();
  process.exit(0);
});
```

### Task 3.4: Add actual token counting to cost tracker

**Files:**
- Modify: `backend/src/services/ai/openai-compatible.ts`
- Modify: `backend/src/services/ai/ollama.ts`
- Modify: `backend/src/services/ai/costTracker.ts`

- [ ] **Step 1: Capture response headers**

In AI providers, extract `x-ratelimit-remaining-tokens` or response body token counts.

- [ ] **Step 2: Pass actual counts to cost tracker**

Update `logAiUsage` calls to use real token counts from API responses.

- [ ] **Step 3: Verify**

Run: `npm test`

### Task 3.5: Add image upload and persistence

**Files:**
- Modify: `backend/src/services/ai/comfyui.service.ts`
- Create: `backend/src/services/storage.service.ts`
- Modify: `backend/src/routes/studio.routes.ts`

- [ ] **Step 1: Add local storage service**

Save generated images to `backend/uploads/` with timestamped filenames.

- [ ] **Step 2: Serve uploads**

Register `@fastify/static` for `/uploads` directory.

- [ ] **Step 3: Update generate-image endpoint**

Return `/uploads/filename.png` instead of ephemeral ComfyUI URL.

### Task 3.6: Add content versioning

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/version.service.ts`
- Create: `backend/src/routes/version.routes.ts`

- [ ] **Step 1: Add ContentVersion model**

```prisma
model ContentVersion {
  id          String   @id @default(cuid())
  postId      String
  content     String
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: Auto-save versions on edit**

Every time a library item is updated, create a version snapshot.

- [ ] **Step 3: Add version history endpoint**

`GET /library/:id/versions` and `POST /library/:id/restore/:versionId`.

---

## Phase 4: Performance & Polish (Score: 95 → 100)

### Task 4.1: Performance audit and optimization

**Files:**
- Create: `docs/PERFORMANCE.md`

- [ ] **Step 1: Add bundle analyzer**

Install `rollup-plugin-visualizer` and generate bundle report.

- [ ] **Step 2: Run Lighthouse**

Document scores in `docs/PERFORMANCE.md`.

- [ ] **Step 3: Optimize images**

Add `vite-imagetools` or `vite-plugin-image-placeholder` for placeholder images.

- [ ] **Step 4: Add React.memo to heavy lists**

Memoize `Library` item rows and `Publish` queue items.

### Task 4.2: Add Framer Motion page transitions

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Add AnimatePresence to routes**

Wrap `<Routes>` with `<AnimatePresence mode="wait">` and add `motion.div` wrappers for page transitions.

- [ ] **Step 2: Add staggered list animations**

Apply staggered children animation to Library and Publish lists (partially done, but extend to all lists).

### Task 4.3: Add AI provider health check to /health

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Extend health endpoint**

Add AI provider ping (Ollama `/api/tags`, DeepSeek `/models`, OpenAI `/models`) to `/health`.

- [ ] **Step 2: Update frontend status**

Show green/yellow/red indicator based on health + circuit breaker state.

### Task 4.4: Add input sanitization (XSS prevention)

**Files:**
- Modify: `backend/src/services/library.service.ts`
- Modify: `backend/src/services/project.service.ts`
- Modify: `backend/src/services/research.service.ts`

- [ ] **Step 1: Install sanitize-html or DOMPurify**

```bash
cd backend && npm install isomorphic-dompurify
```

- [ ] **Step 2: Sanitize content fields**

Before saving `content`/`summary`/`description`, run through sanitizer with `ALLOWED_TAGS: []` (plain text only for personal use).

### Task 4.5: Add scheduled job runner for AI health checks

**Files:**
- Create: `backend/src/lib/scheduler.ts`

- [ ] **Step 1: Add setInterval-based scheduler**

Run AI provider health checks every 5 minutes, log to cost tracker.

- [ ] **Step 2: Update AI status endpoint**

Return last health check timestamp.

### Task 4.6: Final polish — 404 page, favicon, mobile menu state

**Files:**
- Modify: `frontend/src/pages/NotFound.tsx`
- Create: `frontend/public/favicon.ico`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Make NotFound helpful**

Add link back to dashboard and quick-action buttons.

- [ ] **Step 2: Add favicon**

Generate a simple SVG favicon for Mint.

- [ ] **Step 3: Persist mobile sidebar state**

Store sidebar open/closed in localStorage.

- [ ] **Step 4: Verify all lint and tests pass**

Run: `npm run lint && npm test && npm run build`
Expected: All green.

---

## Acceptance Criteria

- `npm run lint`: 0 errors, 0 warnings
- `npm test`: 100% pass rate, 80%+ coverage
- `npm run build`: succeeds with no warnings
- All core features (generate, library, publish, research, projects, templates) fully functional with real session/user binding
- PWA installable on mobile
- Content scheduling works
- Undo/restore works
- Zero `any` types in new code
- Zero console.error / console.log in production code

---

*Plan created: 2026-06-25*
