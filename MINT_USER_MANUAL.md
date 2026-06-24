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
│  DeepSeek │ Ollama HTTP │ ComfyUI HTTP                │
├─────────────────────────────────────────────────────┤
│                    PostgreSQL DB                       │
│  Users │ ContentProjects │ GeneratedPosts │ Research   │
└─────────────────────────────────────────────────────┘
```

---

## Pages & Features

### 1. Landing Page (`/`)

The entry point. Email input form. User enters their email, clicks **"Launch Mint"**. Dev-only: auto-verifies with a dummy token and stores JWT in localStorage.

In production, this will send an email magic link through SMTP.

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

**Upcoming (Phase 1):**
- AI provider abstraction (DeepSeek/Ollama/OpenAI) wired through backend routes
- ComfyUI integration — will generate thumbnail images from prompts
- Streaming AI responses (SSE)
- Per-user rate limiting on AI endpoints

---

### 4. Research (`/app/research`)

Competitor and keyword research tool.

**Currently:** Placeholder. Submits a query to `POST /api/research` which returns a static stub response.

**Planned:** Integration with search APIs for competitive analysis data.

---

### 5. Library (`/app/library`)

Store and manage your generated content.

**Currently:** Placeholder — shows "Library coming next." All generated content is saved to `localStorage` for demo purposes.

**Planned:** Full CRUD with PostgreSQL persistence, filtering by project, status management (draft/published/archived), search, bulk operations.

---

### 6. Publish (`/app/publish`)

Schedule and post content to social platforms.

**Currently:** Placeholder — shows "Publish queue coming next."

**Planned:** Queue management, platform selection (YouTube, Instagram), scheduling calendar, webhook integration.

---

## AI Providers

| Provider | Status | Model | Endpoint | Env Var |
|----------|--------|-------|----------|---------|
| **Ollama** (browser direct) | ✅ Active | `llama3.1:8b` | `http://localhost:11434` | `OLLAMA_BASE_URL` |
| **DeepSeek API** | 🔧 Planned | DeepSeek V3 | API cloud | `DEEPSEEK_API_KEY` |
| **OpenAI** | 🟡 Service exists | `gpt-4o-mini` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| **ComfyUI** | 🟡 Service exists | Any SD model | Configurable | `COMFYUI_BASE_URL` |

OpenAI and ComfyUI service implementations exist but are not yet wired to route handlers.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required
JWT_SECRET=change-me            # Must be set, no fallback
DATABASE_URL=postgresql://...    # PostgreSQL connection string

# AI Providers
LLM_PROVIDER=openai             # Provider selection (openai/anthropic/google/deepseek)
OPENAI_API_KEY=sk-...           # For OpenAI content generation
ANTHROPIC_API_KEY=              # Anthropic API key
GOOGLE_AI_API_KEY=              # Google AI API key
DASHSCOPE_API_KEY=              # DashScope API key
OLLAMA_BASE_URL=http://localhost:11434  # Default, optional

# Image Generation
IMAGE_PROVIDER=openai           # Provider selection (openai/comfyui)
OPENAI_IMAGE_API_KEY=           # For DALL-E image generation

# Research
RESEARCH_PROVIDER=brave         # Research API provider
BRAVE_SEARCH_API_KEY=           # Brave Search API key

# Auth
SMTP_HOST=                      # Magic-link email sending
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Storage (future)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=

# Caching (future)
REDIS_URL=redis://localhost:6379
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
# Terminal 1: Start backend
npm run backend:dev

# Terminal 2: Start frontend
npm run dev
```

Uses Railway PostgreSQL by default. For local DB, set `DATABASE_URL` in `backend/.env`.

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
| **JWT** | Registered via @fastify/jwt, HMAC-SHA256 with `exp` + `iat` validation |
| **CORS** | Restrictive in production (configurable via `FRONTEND_URL`) |
| **Rate Limiting** | 5 req/min on auth, 100/min general API |
| **Input Validation** | Zod on all API routes |
| **Error Handling** | AppError distinction (4xx operational vs 5xx programming) |
| **Helmet** | Registered (security headers for API mode) |
| **Secrets** | All via env vars, fails fast at startup |

---

## Current Status (June 2026)

| Component | Status | Notes |
|-----------|--------|-------|
| **Auth** | ⚠️ Dev-only | Magic link with real JWT, hardcoded verification |
| **Projects CRUD** | ✅ Functional | Create + list projects |
| **Content Studio** | ✅ Functional | Generates via Ollama directly from browser |
| **Research** | ⚠️ Stub | Submits query, returns static response |
| **Library** | ⚠️ Stub | localStorage-based, PG planned |
| **Publish** | ❌ Placeholder | Not implemented |
| **OpenAI/ComfyUI** | 🟡 Service exists | Implemented but not wired to routes |
| **Tests** | ❌ None | Vitest configured but no tests written |
| **Docker** | ✅ Complete | Dockerfiles + compose with healthchecks |

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
AI:         Ollama (active) / DeepSeek (planned) / OpenAI (service exists) / ComfyUI (service exists)
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
│   ├── services/        # Business logic + AI (openai, comfyui, ollama in studio)
│   ├── middleware/      # JWT auth middleware
│   ├── utils/           # JWT sign/verify
│   └── lib/             # Error classes (AppError, NotFoundError, ValidationError)
└── backend/prisma/      # Schema + migrations
```
