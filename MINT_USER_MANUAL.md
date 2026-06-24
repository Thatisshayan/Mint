# MINT — User Manual

## What is MINT?

MINT is a **self-hosted content creation workstation** for faceless channels. It helps you research topics, generate scripts/captions/thumbnail prompts, organize content, and schedule publication — all powered by local or cloud AI.

Target audience: YouTube Shorts creators, Instagram reel makers, and digital content producers who want to automate their writing workflow.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                     User (Browser)                    │
├─────────────────────────────────────────────────────┤
│  React 18 + Vite 6 + Tailwind CSS 3 + shadcn/ui     │
│  TanStack Query 5 + Zustand 5 + Framer Motion 12    │
│  React Router 7                                      │
├─────────────────────────────────────────────────────┤
│                    Vite Dev Proxy                     │
│                 (localhost:5173 -> :4000)             │
├─────────────────────────────────────────────────────┤
│               Fastify 4 Backend API                    │
│  JWT Auth │ Prisma ORM │ Zod Validation │ Rate Limit  │
│  OpenAI SDK │ Ollama HTTP │ ComfyUI HTTP              │
├─────────────────────────────────────────────────────┤
│                    PostgreSQL DB                       │
│  Users │ ContentProjects │ GeneratedPosts │ Research   │
└─────────────────────────────────────────────────────┘
```

---

## Pages & Features

### 1. Landing Page (`/`)

The entry point. One button: **"Launch Mint"**. Clicking it calls a dev-only magic-link auth flow that signs you in instantly with `demo@example.com`.

In production, this will send an email magic link.

---

### 2. Projects (`/app/projects`)

Manage your content projects — each project is a content bucket (e.g., "AI Tutorials", "Faceless Tech Channel").

**What you can do:**
- Create a project with a title + description
- View a list of all your projects
- (Future) click into a project to see its generated content

**Tech:** `useQuery` + `useMutation` via TanStack Query. Data fetched from `GET /api/projects` / `POST /api/projects`.

---

### 3. Content Studio (`/app/studio`)

The core feature. Generate content via AI.

**Input fields:**
| Field | Description |
|-------|-------------|
| **Topic/Brief** | What the content is about (min 3 chars) |
| **Content Type** | YouTube Script (60s) / Instagram Caption / Thumbnail Prompt / Full Package |
| **Tone** | Educational / Professional / Casual / Entertaining |

**How generation works:**
1. You fill in the form (Zod validation on all fields)
2. MINT sends your brief + tone + type to **Ollama** (local `llama3.1:8b` running at `localhost:11434`)
3. A specialized prompt is built depending on content type:
   - **YouTube Script**: Hook + body + CTA (60-second Shorts format)
   - **Instagram Caption**: Short caption + hashtags
   - **Thumbnail Prompt**: Visual description for image generation
   - **Full Package**: All three combined
4. If Ollama is unreachable, a **fallback template** generates placeholder content

**After generation:**
- Copy to clipboard
- Save to Library (stored in localStorage)

**Upcoming (in PR):**
- OpenAI integration (`gpt-4o-mini`) — will replace Ollama as the primary generator
- ComfyUI integration — will generate actual thumbnail images from prompts
- 30-second timeout with 3 retries for all AI calls

---

### 4. Research (`/app/research`)

Competitor and keyword research tool.

**Currently:** Placeholder. Submits a query to `POST /api/research` which returns a static stub response.

**Planned:** Integration with Brave Search API (env var: `BRAVE_SEARCH_API_KEY`) to return real competitive analysis data.

---

### 5. Library (`/app/library`)

Store and manage your generated content.

**Currently:** Placeholder — shows "Library coming next." All generated content is saved to `localStorage` for demo purposes.

**Planned:** Full CRUD with PostgreSQL persistence, filtering by project, status management (draft/published/archived), search, bulk operations.

---

### 6. Publish (`/app/publish`)

Schedule and post content to social platforms.

**Currently:** Placeholder — shows "Publish queue coming next."

**Planned:** Queue management, platform selection (Twitter, LinkedIn, Instagram), scheduling calendar, webhook integration.

---

## AI Providers

| Provider | Status | Model | Endpoint | Env Var |
|----------|--------|-------|----------|---------|
| **Ollama** (default) | ✅ Active | `llama3.1:8b` | `http://localhost:11434` | `OLLAMA_BASE_URL` |
| **OpenAI** | 🟡 In PR | `gpt-4o-mini` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| **ComfyUI** | 🟡 In PR | Any SD model | Configurable | `COMFYUI_BASE_URL` |

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required
JWT_SECRET=change-me            # Must be set, no fallback
DATABASE_URL=postgresql://...    # PostgreSQL connection string

# AI Providers
OPENAI_API_KEY=sk-...            # For OpenAI content generation
OLLAMA_BASE_URL=http://localhost:11434  # Default, optional
COMFYUI_BASE_URL=               # ComfyUI endpoint (optional)

# Auth
SMTP_HOST=                       # Magic-link email sending
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Storage
S3_ENDPOINT=                     # File uploads (future)
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=

# Frontend URL (for CORS)
FRONTEND_URL=https://your-mint-domain.com
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=/api                # API base URL (proxied in dev)
```

---

## Database Schema (PostgreSQL)

```
┌─────────────────┐
│      User        │
├─────────────────┤
│ id        cuid   │
│ email     unique │
│ name?            │
│ passwordHash?    │
│ createdAt        │
│ updatedAt        │
└────────┬────────┘
         │ 1
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
┌───┴────┐ ┌──┴───────┐ ┌───┴───────┐
│Content │ │Generated │ │ Research  │
│Project │ │  Post    │ │  Report   │
├────────┤ ├──────────┤ ├───────────┤
│id cuid │ │id cuid   │ │id cuid    │
│title   │ │content   │ │query      │
│status  │ │platform  │ │source     │
│metadata│ │status    │ │summary    │
└────────┘ └──────────┘ └───────────┘
```

---

## Running MINT

### Development
```bash
# Terminal 1: Start PostgreSQL (Docker)
docker compose up postgres

# Terminal 2: Start backend
npm run backend:dev

# Terminal 3: Start frontend
npm run dev
```

### Production
```bash
# Full stack with Docker
docker compose up --build

# Or manually:
npm run build          # Frontend + backend TypeScript check
npm run backend:start  # Run compiled backend
```

---

## Security

| Feature | Status |
|---------|--------|
| **JWT** | HMAC-SHA256 with `exp` + `iat` validation, timing-safe comparison |
| **CORS** | Restrictive in production (configurable via `FRONTEND_URL`) |
| **Rate Limiting** | 5 req/min on auth, 100 global |
| **Input Validation** | Zod on all API routes |
| **Error Handling** | Operational (4xx) vs programming (5xx) errors distinguished |
| **Secrets** | Never hardcoded — all via env vars, fails fast at startup |

---

## Current Status (June 2026)

| Component | Status | Notes |
|-----------|--------|-------|
| **Auth** | ⚠️ Dev-only | Magic link sends to hardcoded email |
| **Projects CRUD** | ✅ Functional | Create + list projects |
| **Content Studio** | ✅ Functional | Generates via Ollama, has Zod validation |
| **Research** | ⚠️ Stub | Submits query, returns static response |
| **Library** | ⚠️ Stub | localStorage-based, PG planned |
| **Publish** | ❌ Placeholder | Not implemented |
| **OpenAI** | 🟡 In PR | Merged but waiting for `OPENAI_API_KEY` |
| **ComfyUI** | 🟡 In PR | Merged but waiting for `COMFYUI_BASE_URL` |
| **Tests** | ❌ None | Vitest configured but no tests written |
| **Docker** | ✅ Complete | Healthchecks on all services |

---

## Tech Stack Summary

```
Frontend:   React 18 + TypeScript 5.7 + Vite 6 + Tailwind CSS 3 + shadcn/ui
State:      TanStack Query 5 (server) + Zustand 5 (client)
Forms:      React Hook Form + Zod
Animation:  Framer Motion 12
Backend:    Fastify 4 + TypeScript 5.7
Auth:       @fastify/jwt (HMAC-SHA256) + magic-link email
DB:         PostgreSQL 16 + Prisma 6 ORM
AI:         Ollama (local) / OpenAI (cloud) / ComfyUI (self-hosted)
CI/CD:      GitHub Actions + Docker Compose
```

---

## File Map

```
mint/
├── frontend/src/
│   ├── pages/           # Landing, AppHome, Projects, Studio, Research, Library, Publish
│   ├── components/
│   │   ├── layout/      # AppShell (Header + Sidebar), AppLayout
│   │   ├── ui/          # Loading, Skeleton, ErrorBoundary
│   │   └── ContentGenerator.tsx  # Main AI generation component
│   ├── hooks/           # useSession (auth state)
│   ├── stores/          # Zustand/TanStack stores (projects, studio, research, library, publish)
│   └── lib/api/         # fetchWrapper, client (typed), auth
├── backend/src/
│   ├── routes/          # auth, projects, research, studio, library, publish
│   ├── services/        # Business logic + AI (openai, comfyui, ollama)
│   ├── middleware/      # JWT auth middleware
│   ├── utils/           # JWT sign/verify
│   └── lib/             # Error classes (AppError, NotFoundError, ValidationError)
└── backend/prisma/      # Schema + migrations
```
