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
  │  ├─ /api/research/*   — Competitor/topic research
  │  ├─ /api/library/*    — Saved content management
  │  └─ /api/publish/*    — Queue & publish management
  │
  ├─ AI Providers (via provider abstraction)
  │  ├─ DeepSeek API      — Primary text generation
  │  ├─ Ollama (local)    — Fallback text generation
  │  ├─ ComfyUI (local)   — Image generation
  │  └─ MoneyPrinterTurbo — Video generation (Docker sidecar)
  │
  └─ PostgreSQL DB (Railway)
     ├─ User
     ├─ ContentProject
     ├─ GeneratedPost
     └─ ResearchReport

## Frontend Component Tree
App
├─ RouteGuard (auth redirect)
├─ Suspense + Loading
├─ Routes
│  ├─ / → Landing (magic link login)
│  └─ /app/* → AppLayout (sidebar + header)
│      └─ ErrorBoundary
│          ├─ /projects — Projects (CRUD)
│          ├─ /studio — ContentGenerator + video pipeline
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
