# MINT — User Manual

## What is MINT?

MINT is a **self-hosted content creation workstation** for faceless channels. It helps you research topics, generate scripts/captions/thumbnail prompts, produce voiceovers and videos, organize content, and schedule publication — all powered by local or cloud AI.

Target audience: YouTube Shorts creators, Instagram reel makers, and digital content producers who want to automate their writing and video production workflow.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        User (Browser)                           │
├────────────────────────────────────────────────────────────────┤
│  React 18 + Vite 6 + Tailwind CSS 3 + shadcn/ui                │
│  TanStack Query 5 + Zustand 5 + Framer Motion 12               │
│  React Router 7 — Dark/Light mode — Mint green theme           │
├────────────────────────────────────────────────────────────────┤
│                      Vite Dev Proxy                             │
│                   (localhost:5173 -> :4000)                     │
├────────────────────────────────────────────────────────────────┤
│                  Fastify 4 Backend API                           │
│  JWT Auth │ Prisma ORM │ Zod Validation │ Rate Limiting         │
│  Helmet │ Global Error Handler │ AppError                       │
├────────────────────────────────────────────────────────────────┤
│  Text AI     │  Media Services     │  Integrations              │
│  ─────────── │  ─────────────────  │  ───────────────────       │
│  DeepSeek    │  Edge TTS (voice)   │  Pexels API (stock)        │
│  Ollama HTTP │  MoneyPrinterTurbo  │  FFmpeg (video assembly)   │
│  OpenAI      │  ComfyUI (images)   │  Whisper (transcription)   │
├────────────────────────────────────────────────────────────────┤
│                      PostgreSQL DB                              │
│  Users │ ContentProjects │ GeneratedPosts │ ResearchReports     │
└────────────────────────────────────────────────────────────────┘
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
- Click into a project to see its generated content

**Tech:** `useQuery` + `useMutation` via TanStack Query. Data fetched from `GET /api/projects` / `POST /api/projects`.

---

### 3. Content Studio (`/app/studio`)

The core feature. Generate content via AI.

**Input fields:**
| Field | Description |
|-------|-------------|
| **Topic/Brief** | What the content is about (min 3 chars) |
| **Content Type** | YouTube Script (60s) / Instagram Caption / Thumbnail Prompt / Hook / Scenario / Full Package |
| **Tone** | Educational / Professional / Casual / Entertaining |

**How generation works:**
1. You fill in the form (Zod validation on all fields)
2. MINT sends your brief + tone + type to the backend API (`POST /api/studio/generate`)
3. Backend selects the configured AI provider (DeepSeek / Ollama / OpenAI via `LLM_PROVIDER` env var)
4. A specialized prompt template is built depending on content type:
   - **YouTube Script**: Hook + body + CTA (60-second Shorts format)
   - **Instagram Caption**: Short caption + hashtags
   - **Thumbnail Prompt**: Visual description for image generation
   - **Hook**: 5 opening hooks for videos
   - **Scenario**: Scene-by-scene outline
   - **Full Package**: Script + caption + thumbnail prompt combined
5. The provider generates text content; for image generation, the route forwards to ComfyUI
6. The response is returned to the frontend for copying, saving, or further editing

**After generation:**
- Copy to clipboard
- Save to Library (persisted in PostgreSQL via backend API)

**Next Actions panel:**
After generating a script, the Next Actions panel offers:
- **Generate Voiceover** — Converts script text to spoken audio using Edge TTS (`POST /api/studio/generate-voice`). The audio plays inline in the UI.
- **Generate Short Video** — Sends the script to MoneyPrinterTurbo via `POST /api/studio/generate-video`. Returns a task ID; the frontend polls `GET /api/studio/generate-video/:taskId` until the MP4 is ready. The resulting video can be previewed and downloaded.
- **Search Stock Footage** — Searches Pexels for royalty-free video clips (`POST /api/studio/search-stock`)
- **Assemble Video** — Combines clips + audio into a single MP4 via FFmpeg (`POST /api/studio/assemble-video`)
- **Transcribe Audio** — Converts audio to text via Whisper (`POST /api/studio/transcribe`)

**Voiceover pipeline:** Script text → Edge TTS (tts.service.ts) → MP3 audio file → served to frontend.

**Video pipeline:** Script text → Edge TTS voiceover → MoneyPrinterTurbo (Docker sidecar, video.service.ts) → MP4 video → served to frontend.

**Stock + Assembly pipeline:** Pexels stock footage search → select clips → FFmpeg assembly with audio overlay → MP4.

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

| Provider | Status | Purpose | Endpoint | Env Var |
|----------|--------|---------|----------|---------|
| **DeepSeek API** | ✅ Active (primary) | Text generation | API cloud | `DEEPSEEK_API_KEY` |
| **Ollama** | ✅ Active (fallback) | Text generation | `http://localhost:11434` | `OLLAMA_BASE_URL` |
| **OpenAI** | ✅ Active (optional) | Text generation | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| **ComfyUI** | ✅ Active | Image generation | Configurable | `COMFYUI_BASE_URL` |
| **MoneyPrinterTurbo** | ✅ Active | Video generation | Docker sidecar (:10010) | `MPT_BASE_URL` |
| **Edge TTS** | ✅ Active | Voiceover | edge-tts CLI | N/A |
| **Pexels API** | ✅ Active | Stock footage | API cloud | `PEXELS_API_KEY` |
| **Whisper** | ✅ Active | Transcription | Local model | N/A |
| **FFmpeg** | ✅ Active | Video assembly | Local binary | N/A |

Text-generation providers (DeepSeek/Ollama/OpenAI) are wired through the backend AI provider abstraction, selectable via `LLM_PROVIDER` env var. Media services (video, voiceover, stock, assembly, transcription) run as separate services.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required
JWT_SECRET=change-me            # Must be set, no fallback
DATABASE_URL=postgresql://...    # PostgreSQL connection string

# AI Providers
LLM_PROVIDER=deepseek            # Provider selection (deepseek/ollama/openai)
DEEPSEEK_API_KEY=sk-...          # DeepSeek API key (primary)
OPENAI_API_KEY=sk-...            # OpenAI API key (optional)
OLLAMA_BASE_URL=http://localhost:11434  # Default, optional

# Image Generation
COMFYUI_BASE_URL=http://localhost:8188  # ComfyUI API

# Video Generation
MPT_BASE_URL=http://localhost:10010     # MoneyPrinterTurbo API

# Stock Footage
PEXELS_API_KEY=                  # Pexels API key

# Auth
SMTP_HOST=                       # Magic-link email sending (production)
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Storage (future)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
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

### Production (Docker)
```bash
# Full stack with Docker
docker compose up --build

# Or manually:
npm run build          # Frontend + backend TypeScript check
npm run backend:start  # Run compiled backend
```

### Railway Deployment
```bash
# Install CLI and deploy
npm i -g @railway/cli
railway login
railway link
railway plugin add postgresql
railway up
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
| **Projects CRUD** | ✅ Functional | Create + list + view projects |
| **Content Studio** | ✅ Functional | Generates via backend AI provider abstraction (DeepSeek/Ollama/OpenAI) |
| **Research** | ✅ Functional | AI-powered research reports via backend |
| **Library** | ✅ Functional | PostgreSQL-backed content storage |
| **Publish** | ✅ Functional | Queue management via Prisma |
| **Image Generation** | ✅ Functional | ComfyUI wired via `/studio/generate-image` |
| **Voiceover Generation** | ✅ Functional | Edge TTS wired via `/studio/generate-voice` |
| **Video Generation** | ✅ Functional | MoneyPrinterTurbo wired via `/studio/generate-video` |
| **Stock Footage** | ✅ Functional | Pexels API via `/studio/search-stock` |
| **Video Assembly** | ✅ Functional | FFmpeg via `/studio/assemble-video` |
| **Transcription** | ✅ Functional | Whisper via `/studio/transcribe` |
| **Custom Theme** | ✅ Functional | Mint green palette, dark/light mode |
| **Logo + Favicon** | ✅ Complete | Processed mint-logo.png, favicon.png |
| **Railway Deploy** | ✅ Configured | railway.json, Dockerfile, healthcheck |
| **Tests** | ❌ Minimal | Vitest configured but few tests written |
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
Media:      ComfyUI (image) / MoneyPrinterTurbo (video, Docker sidecar) / Edge TTS (voiceover)
            Pexels (stock footage) / FFmpeg (video assembly) / Whisper (transcription)
CI/CD:      Docker Compose + Railway
```

---

## File Map

```
mint/
├── frontend/src/
│   ├── pages/           # Landing, AppHome, Projects, Studio, Research, Library, Publish
│   ├── components/
│   │   ├── layout/      # AppShell (Header + Sidebar), AppLayout
│   │   ├── ui/          # Loading, Skeleton, Loader, Button, Input
│   │   └── ContentGenerator.tsx, RouteGuard.tsx, ThemeProvider.tsx, ErrorBoundary.tsx
│   ├── hooks/           # useSession (auth state)
│   ├── stores/          # Zustand/TanStack stores (projects, studio, research, library, publish)
│   ├── styles/          # globals.css (mint green theme with dark/light)
│   └── lib/api/         # fetchWrapper, client (typed), auth
├── frontend/public/     # mint-logo.png, favicon.png
├── backend/src/
│   ├── routes/          # auth, projects, research, studio, library, publish
│   ├── services/
│   │   ├── auth, project, studio, research, library, publish
│   │   └── ai/          # openai, comfyui, tts, video, pexels, whisper, assembly
│   ├── middleware/      # JWT auth middleware
│   ├── utils/           # JWT sign/verify
│   └── lib/             # Error classes (AppError, NotFoundError, ValidationError)
├── backend/prisma/      # Schema + migrations
├── railway.json         # Railway deployment config
└── docker-compose.yml   # MINT + MoneyPrinterTurbo sidecar
```
