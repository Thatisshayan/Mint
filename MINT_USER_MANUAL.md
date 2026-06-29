# MINT — User Manual

## What is MINT?

MINT is a **self-hosted content creation workstation** for faceless channels. It helps you research topics, generate scripts/captions/thumbnail prompts, produce voiceovers and videos, organize content, and schedule publication — all powered by local AI.

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
│                  Fastify 5 Backend API                           │
│  JWT Auth │ Prisma ORM │ Zod Validation │ Rate Limiting         │
│  Helmet │ Global Error Handler │ AppError                       │
├────────────────────────────────────────────────────────────────┤
│  Text AI     │  Media Services     │  Integrations              │
│  ─────────── │  ─────────────────  │  ───────────────────       │
│  Ollama      │  Piper TTS (voice)  │  Brave Search (research)   │
│  DeepSeek    │  ComfyUI (images)   │  MoneyPrinterTurbo (video) │
│  OpenAI      │                     │                            │
├────────────────────────────────────────────────────────────────┤
│                      SQLite DB                                  │
│  Users │ ContentProjects │ GeneratedPosts │ ResearchReports     │
└────────────────────────────────────────────────────────────────┘
```

---

## Pages & Features

### 1. Landing Page (`/`)

The entry point. Email input form. User enters their email, clicks **"Launch Mint"**. Dev-only: auto-verifies with a dummy token and stores JWT in localStorage.

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
3. Backend selects the configured AI provider (Ollama / DeepSeek / OpenAI via `LLM_PROVIDER` env var)
4. A specialized prompt template is built depending on content type
5. The provider generates text content; for image generation, the route forwards to ComfyUI
6. The response is returned to the frontend for copying, saving, or further editing

**After generation:**
- Copy to clipboard
- Save to Library (persisted in SQLite via backend API)

---

### 4. Research (`/app/research`)

Competitor and keyword research tool powered by AI.

**What you can do:**
- Enter a topic or keyword to analyze
- MINT sends your query to the backend (`POST /api/research`)
- Backend uses the AI provider to generate a structured research report
- Results include competitive analysis, content gaps, and trend insights

**Tech:** AI-powered research via Ollama/DeepSeek/OpenAI provider.

---

### 5. Library (`/app/library`)

Store and manage your generated content.

**What you can do:**
- View all saved generated content (scripts, captions, thumbnails)
- Filter by project or content type
- Delete saved items
- Save generated content directly from the Studio

**Tech:** Data persisted via SQLite through `GET/POST/DELETE /api/library` routes.

---

### 6. Publish (`/app/publish`)

Queue and manage content for publication.

**What you can do:**
- View queued content items
- Manage publish queue status (pending/scheduled/published)
- Remove items from queue

**Tech:** Queue management via `GET/POST /api/publish` routes backed by SQLite.

---

## AI Providers

| Provider | Status | Purpose | Endpoint | Env Var |
|----------|--------|---------|----------|---------|
| **Ollama** | ✅ Active (primary) | Text generation | `http://localhost:11434` | `OLLAMA_BASE_URL` |
| **DeepSeek API** | ✅ Active (fallback) | Text generation | API cloud | `DEEPSEEK_API_KEY` |
| **OpenAI** | ✅ Active (optional) | Text generation | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| **ComfyUI** | ✅ Active | Image generation | `http://localhost:8188` | `COMFYUI_BASE_URL` |
| **MoneyPrinterTurbo** | ✅ Active | Video generation | `http://localhost:8501` | `MONEY_PRINTER_BASE_URL` |
| **Piper TTS** | ✅ Active | Voiceover | Local binary | `PIPER_EXECUTABLE` |

Text-generation providers (Ollama/DeepSeek/OpenAI) are wired through the backend AI provider abstraction, selectable via `LLM_PROVIDER` env var.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# LLM: Use Ollama locally (no API key needed)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Image Generation
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188

# Video Generation
MONEY_PRINTER_BASE_URL=http://localhost:8501

# Text-to-Speech
TTS_PROVIDER=piper
PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe
PIPER_VOICE_DIR=D:\AgentDevWork\Programs\piper-tts\voices

# Auth
JWT_SECRET=change-me
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Database (SQLite)
DATABASE_URL=file:./mint.db

# Research
RESEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Database Schema (SQLite)

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
# Start all services
start-mint.bat

# Or manually:
npm run dev:all    # Backend + frontend concurrently
```

### Individual Services

```bash
npm run dev              # Frontend only (Vite, :5173)
npm run backend:dev      # Backend only (tsx, :4000)
```

### Production

```bash
npm run build            # TypeScript check + Vite build
npm run backend:build    # Build backend for production
```

---

## Security

| Feature | Status |
|---------|--------|
| **JWT** | Registered via @fastify/jwt, HMAC-SHA256 with `exp` + `iat` validation |
| **CORS** | Restrictive in production (configurable via `FRONTEND_URL`) |
| **Rate Limiting** | 100/min general API |
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
| **Content Studio** | ✅ Functional | Generates via backend AI provider abstraction (Ollama/DeepSeek/OpenAI) |
| **Research** | ✅ Functional | AI-powered research reports via backend |
| **Library** | ✅ Functional | SQLite-backed content storage |
| **Publish** | ✅ Functional | Queue management via Prisma |
| **Image Generation** | ✅ Functional | ComfyUI wired via `/studio/generate-image` |
| **Voiceover Generation** | ✅ Functional | Piper TTS wired via `/studio/generate-voice` |
| **Video Generation** | ✅ Functional | MoneyPrinterTurbo wired via `/studio/generate-video` |
| **Custom Theme** | ✅ Functional | Mint green palette, dark/light mode |
| **Logo + Favicon** | ✅ Complete | Processed mint-logo.png, favicon.png |
| **Tests** | ❌ Minimal | Vitest configured but few tests written |

---

## Tech Stack Summary

```
Frontend:   React 18 + TypeScript 5.7 + Vite 6 + Tailwind CSS 3 + shadcn/ui
State:      TanStack Query 5 (server) + Zustand 5 (client)
Forms:      React Hook Form + Zod
Animation:  Framer Motion 12
Backend:    Fastify 5 + TypeScript 5.7
Auth:       @fastify/jwt (HMAC-SHA256) + magic-link email
DB:         SQLite + Prisma 6 ORM
AI:         Ollama (primary) / DeepSeek (fallback) / OpenAI (optional)
Media:      ComfyUI (image) / Piper TTS (voiceover) / MoneyPrinterTurbo (video)
```

---

## File Map

```
MINT/
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
└── start-mint.bat       # Master launcher script
```
