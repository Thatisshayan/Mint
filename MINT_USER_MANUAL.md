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
│  Edge TTS │ MoneyPrinterTurbo (Docker :10010)         │
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
2. MINT sends your brief + tone + type to the backend API (`POST /api/studio/generate`)
3. Backend selects the configured AI provider (DeepSeek / Ollama / OpenAI via `LLM_PROVIDER` env var)
4. A specialized prompt template is built depending on content type:
   - **YouTube Script**: Hook + body + CTA (60-second Shorts format)
   - **Instagram Caption**: Short caption + hashtags
   - **Thumbnail Prompt**: Visual description for image generation
   - **Full Package**: All three combined
5. The provider generates text content; for image generation, the route forwards to ComfyUI
6. The response is returned to the frontend for copying, saving, or further editing

**After generation:**
- Copy to clipboard
- Save to Library (persisted in PostgreSQL via backend API)

**Next Actions panel:**
After generating a script, the Next Actions panel offers:
- **Generate Voiceover** — Converts script text to spoken audio using Edge TTS (`POST /api/studio/generate-voice`). The audio plays inline in the UI.
- **Generate Short Video** — Sends the script to MoneyPrinterTurbo via `POST /api/studio/generate-video`. Returns a task ID; the frontend polls `GET /api/studio/generate-video/:taskId` until the MP4 is ready. The resulting video can be previewed and downloaded.

**Voiceover pipeline:** Script text → Edge TTS (tts.service.ts) → MP3 audio file → served to frontend.

**Video pipeline:** Script text → Edge TTS voiceover → MoneyPrinterTurbo (Docker sidecar, video.service.ts) → MP4 video → served to frontend.

**Upcoming:**
- Streaming AI responses (SSE)
- Per-user rate limiting on AI endpoints

---

### 4. Research (`/app/research`)

Competitor and keyword research tool powered by AI.

**What you can do:**
- Enter a topic or keyword to analyze
- MINT sends your query to the backend (`POST /api/research`)
- Backend uses the AI provider to generate a structured research report
- Results include competitive analysis, content gaps, and trend insights

**Tech:** AI-powered research via DeepSeek/Ollama/OpenAI provider.

---

### 5. Library (`/app/library`)

Store and manage your generated content.

**What you can do:**
- View all saved generated content (scripts, captions, thumbnails)
- Filter by project or content type
- Delete saved items
- Save generated content directly from the Studio

**Tech:** Data persisted via PostgreSQL through `GET/POST/DELETE /api/library` routes.

---

### 6. Publish (`/app/publish`)

Queue and manage content for publication.

**What you can do:**
- View queued content items
- Manage publish queue status (pending/scheduled/published)
- Remove items from queue

**Tech:** Queue management via `GET/POST /api/publish` routes backed by PostgreSQL.

---

## AI Providers

| Provider | Status | Model | Endpoint | Env Var |
|----------|--------|-------|----------|---------|
| **DeepSeek API** | ✅ Active (primary) | DeepSeek V3 | API cloud | `DEEPSEEK_API_KEY` |
| **Ollama** | ✅ Active (fallback) | `llama3.1:8b` | `http://localhost:11434` | `OLLAMA_BASE_URL` |
| **OpenAI** | ✅ Active (optional) | `gpt-4o-mini` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| **ComfyUI** | ✅ Active | Any SD model | Configurable | `COMFYUI_BASE_URL` |
| **MoneyPrinterTurbo** | ✅ Active | MPT API | Docker sidecar (:10010) | `MPT_BASE_URL` |
| **Edge TTS** | ✅ Active | edge-tts CLI | Local/bundled engine | N/A |

Text-generation providers (DeepSeek/Ollama/OpenAI) are wired through the backend AI provider abstraction, selectable via `LLM_PROVIDER` env var. Media services (video, voiceover) run as separate services.

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

# Video Generation
MPT_BASE_URL=http://localhost:10010  # MoneyPrinterTurbo API

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
| **Content Studio** | ✅ Functional | Generates via backend AI provider abstraction (DeepSeek/Ollama/OpenAI) |
| **Research** | ✅ Functional | AI-powered research reports via backend |
| **Library** | ✅ Functional | PostgreSQL-backed content storage |
| **Publish** | ✅ Functional | Queue management via Prisma |
| **Image Generation** | ✅ Functional | ComfyUI wired via `/studio/generate-image` |
| **Voiceover Generation** | ✅ Functional | Edge TTS wired via `/studio/generate-voice` |
| **Video Generation** | ✅ Functional | MoneyPrinterTurbo wired via `/studio/generate-video` |
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
AI:         DeepSeek (primary) / Ollama (fallback) / OpenAI (optional)
Media:      ComfyUI (image gen) / MoneyPrinterTurbo (video gen, Docker sidecar) / Edge TTS (voiceover)
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
│   │   └── ContentGenerator.tsx  # Main AI generation component (Next Actions: voiceover + video)
│   ├── hooks/           # useSession (auth state)
│   ├── stores/          # Zustand/TanStack stores (projects, studio, research, library, publish)
│   └── lib/api/         # fetchWrapper, client (typed), auth
├── backend/src/
│   ├── routes/          # auth, projects, research, studio, library, publish
│   ├── services/        # Business logic + AI (openai, comfyui, ollama, video, tts)
│   ├── middleware/      # JWT auth middleware
│   ├── utils/           # JWT sign/verify
│   └── lib/             # Error classes (AppError, NotFoundError, ValidationError)
├── backend/prisma/      # Schema + migrations
└── docker-compose.yml   # MINT + MoneyPrinterTurbo sidecar
```
