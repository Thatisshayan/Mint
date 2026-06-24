# MINT Architecture

## Data Flow
```
Browser → React App (Vite dev :5173)
           │
           ▼  Vite Proxy (/api → :4000)
           │
Fastify Backend (:4000)
  ├─ Auth Middleware (JWT via @fastify/jwt)
  ├─ Rate Limiter (per-route: 5/min auth, 100/min API)
  ├─ Error Handler (AppError + ZodError → JSON)
  ├─ Helmet (security headers)
  │
  ├─ Routes
  │  ├─ /api/auth/*           — Magic link login, verify, refresh, logout, me
  │  ├─ /api/projects/*       — CRUD content projects
  │  ├─ /api/studio/*         — AI content generation (text, image, video, audio, stock, assembly, transcribe)
  │  │  ├─ POST /studio/generate              — Text generation (script/caption/thumbnail/hook/scenario/full_package)
  │  │  ├─ POST /studio/generate-image        — Image generation via ComfyUI
  │  │  ├─ POST /studio/generate-voice        — Voiceover via Edge TTS
  │  │  ├─ POST /studio/generate-video        — Short video via MoneyPrinterTurbo
  │  │  ├─ GET  /studio/generate-video/:taskId — Poll video generation status
  │  │  ├─ POST /studio/search-stock          — Stock footage via Pexels API
  │  │  ├─ POST /studio/assemble-video        — FFmpeg video assembly
  │  │  └─ POST /studio/transcribe            — Whisper audio transcription
  │  ├─ /api/research/*       — Competitor/topic research via AI provider
  │  ├─ /api/library/*        — Saved content management (CRUD)
  │  └─ /api/publish/*        — Queue & publish management
  │
  ├─ AI / Media Providers
  │  ├─ DeepSeek API               — Primary text generation (DeepSeek V3)
  │  ├─ Ollama (local)             — Fallback text generation (llama3.1:8b)
  │  ├─ OpenAI                     — Optional text generation (gpt-4o-mini)
  │  ├─ ComfyUI                    — Image generation (any SD model)
  │  ├─ MoneyPrinterTurbo          — Video generation (Docker sidecar, port :10010)
  │  ├─ Edge TTS                   — Voiceover generation (edge-tts CLI)
  │  ├─ Pexels API                 — Stock footage search
  │  ├─ Whisper                    — Audio transcription (local model)
  │  └─ FFmpeg                     — Video assembly (concat clips + audio)
  │
  └─ PostgreSQL DB (Railway)
    ├─ User
    ├─ ContentProject
    ├─ GeneratedPost
    └─ ResearchReport
```

## Services (backend/src/services/)

| Service | File | Purpose |
|---------|------|---------|
| Auth | `auth.service.ts` | User lookup, session helpers |
| Project | `project.service.ts` | ContentProject CRUD via Prisma |
| Studio | `studio.service.ts` | AI prompt routing & generation |
| Research | `research.service.ts` | AI-powered research reports |
| Library | `library.service.ts` | GeneratedPost CRUD via Prisma |
| Publish | `publish.service.ts` | Queue management via Prisma |

### AI / Media Services (backend/src/services/ai/)

| Service | File | Purpose |
|---------|------|---------|
| OpenAI | `openai.service.ts` | Text generation provider (DeepSeek/Ollama/OpenAI abstraction) |
| ComfyUI | `comfyui.service.ts` | Image generation via ComfyUI API with polling |
| TTS | `tts.service.ts` | Edge TTS voiceover via CLI |
| Video | `video.service.ts` | MoneyPrinterTurbo API client |
| Pexels | `pexels.service.ts` | Stock footage search |
| Whisper | `whisper.service.ts` | Audio transcription |
| Assembly | `assembly.service.ts` | FFmpeg-based video clip assembly |

## Video Pipeline
```
Script (from AI provider)
       │
       ▼
Edge TTS (tts.service.ts)
       │
       ▼  voiceover.mp3
MoneyPrinterTurbo (video.service.ts — Docker sidecar)
       │  POST /api/studio/generate-video → MPT API → polls task
       ▼
Output MP4 served to frontend for preview/download

Alternatively:
Script → Edge TTS → Pexels stock footage → FFmpeg assembly → MP4
```

## Frontend Component Tree
```
App
├─ RouteGuard (auth redirect)
├─ Suspense + Loading
├─ Routes
│  ├─ / → Landing (magic link login)
│  └─ /app/* → AppLayout (sidebar + header)
│      └─ ErrorBoundary
│          ├─ /projects    — Projects (CRUD)
│          ├─ /studio      — ContentGenerator + video/voiceover/stock pipeline
│          ├─ /library     — Saved content
│          ├─ /research    — AI research tool
│          ├─ /publish     — Queue + schedule
│          └─ * → NotFound
```

## Frontend Theme (Mint Green)
- CSS variables in `globals.css` with mint/teal HSL palette
- Custom components: `.mint-card`, `.mint-btn`, `.mint-btn-ghost`, `.mint-input`, `.mint-badge`
- Dark/light mode via `.dark` class toggle
- Font: Inter from Google Fonts
- Logo: `frontend/public/mint-logo.png` + favicon at `frontend/public/favicon.png`

## Auth Flow (Dev)
1. User enters email on Landing page
2. Frontend calls POST /api/auth/magic-link
3. Backend responds { sent: true } (no real email sent)
4. Frontend auto-calls POST /api/auth/verify with { token: 'dev-token', email }
5. Backend returns real JWT (signed with JWT_SECRET, 24h expiry) + refresh token (7d)
6. Token stored in localStorage → RouteGuard allows /app/*
7. Auth middleware verifies JWT on all protected routes

## Railway Deployment
- Config: `railway.json` (Dockerfile builder, healthcheck at /health)
- Backend Dockerfile: multi-stage build with TypeScript compilation
- Frontend: served via Vite dev proxy during dev, static build for production
- DB: Railway PostgreSQL provisioned and migrated
