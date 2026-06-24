# MINT Architecture

## Data Flow
```
Browser → React App (Vite dev :5173)
           │
           ▼  Vite Proxy (/api → :4000)
           │
Fastify Backend (:4000)
  ├─ Auth Middleware (JWT)
  ├─ Rate Limiter (per-route)
  ├─ Error Handler (AppError + ZodError → JSON)
  │
  ├─ Routes
  │  ├─ /api/auth/*       — Magic link login, verify, refresh
  │  ├─ /api/projects/*   — CRUD content projects
   │  ├─ /api/studio/*     — AI content generation (script, image, video)
   │  │  ├─ POST /studio/generate          — Text generation (DeepSeek/Ollama/OpenAI)
   │  │  ├─ POST /studio/generate-image    — Image generation (ComfyUI)
   │  │  ├─ POST /studio/generate-voice    — Voiceover via Edge TTS
   │  │  ├─ POST /studio/generate-video    — Short video via MoneyPrinterTurbo
   │  │  └─ GET  /studio/generate-video/:taskId — Poll video generation status
   │  ├─ /api/research/*   — Competitor/topic research
  │  ├─ /api/library/*    — Saved content management
  │  └─ /api/publish/*    — Queue & publish management
  │
   ├─ AI / Media Providers
   │  ├─ DeepSeek API      — Primary text generation
   │  ├─ Ollama (local)    — Fallback text generation
   │  ├─ OpenAI            — Optional text generation
   │  ├─ ComfyUI (local)   — Image generation
   │  ├─ MoneyPrinterTurbo — Video generation (Docker sidecar, port :10010)
   │  └─ Edge TTS          — Voiceover generation (via edge-tts CLI)
   │
   └─ PostgreSQL DB (Railway)
     ├─ User
     ├─ ContentProject
     ├─ GeneratedPost
     └─ ResearchReport

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
```

## Frontend Component Tree
App
├─ RouteGuard (auth redirect)
├─ Suspense + Loading
├─ Routes
│  ├─ / → Landing (magic link login)
│  └─ /app/* → AppLayout (sidebar + header)
│      └─ ErrorBoundary
│          ├─ /projects — Projects (CRUD)
│          ├─ /studio — ContentGenerator + video/voiceover pipeline
│          ├─ /library — Saved content
│          ├─ /publish — Queue + schedule
│          └─ * → NotFound

## Auth Flow (Dev)
1. User enters email on Landing page
2. Frontend calls POST /api/auth/magic-link
3. Backend responds { sent: true } (no real email sent)
4. Frontend auto-calls POST /api/auth/verify with { token: 'dev-token', email }
5. Backend returns real JWT (signed with JWT_SECRET, 24h expiry)
6. Token stored in localStorage → RouteGuard allows /app/*
7. Auth middleware verifies JWT on all protected routes
