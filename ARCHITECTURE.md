# MINT Architecture

**Local-first, no-cloud-required AI content workstation.**

## Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser (React SPA)                 │
│                  http://localhost:5173               │
│                                                     │
│  ┌─────────────┐       ┌──────────────────────────┐ │
│  │   Vite      │ proxy │  Fastify 5 on :4000      │ │
│  │   Frontend  │──────►│  Prisma → SQLite          │ │
│  └─────────────┘       └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │ HTTP fetch                │ file I/O
         │ http://localhost:4000     │
         ▼                           ▼
   Local AI Services           backend/prisma/mint.db
   (Ollama, ComfyUI, Piper)
```

## Runtime Modes

| Mode | Frontend URL | Backend | Auth |
|------|-------------|---------|------|
| **Web dev** | `http://localhost:5173` | `http://localhost:4000` | Magic link (dev auto-verify) |

## Backend (Fastify 5)

### Entry Point
`backend/src/index.ts` → runs via tsx (TypeScript execution)

### Startup
On first launch, `start()` runs `CREATE TABLE IF NOT EXISTS` for all models (no `prisma migrate` needed), then ensures the dev user exists.

### Routes

| Prefix | Routes |
|--------|--------|
| `/health` | Status check (no auth) |
| `/api/auth/*` | Magic link, verify, refresh, logout, me |
| `/api/projects/*` | ContentProject CRUD |
| `/api/studio/*` | AI generation (text, image, voice, video, stock, assembly, transcribe, ideas, cost stats, rating) |
| `/api/research/*` | Research reports CRUD + `GET /research/stream` (WS) — real web research via GPT Researcher with an LLM-guess fallback |
| `/api/library/*` | GeneratedPost CRUD + search + favorites |
| `/api/publish/*` | Publish queue CRUD |
| `/api/templates/*` | Template CRUD |
| `/api/export/*` | Full export / restore |
| `/api/files/*` | Browse the unified output folder |
| `/api/settings/*` | Local-service reachability, Ollama model selection, migration self-test |

### Auth Middleware

Web mode: standard `@fastify/jwt` verification. Dev mode auto-verifies with dummy token.

### Database

SQLite via Prisma 6. Schema: `backend/prisma/schema.prisma`.

Models: `User`, `ContentProject`, `GeneratedPost`, `ResearchReport`, `Template`, `MagicLinkToken`

DB file location: `backend/prisma/mint.db`

### AI Provider Chain

```
Request → Ollama (primary, local, free)
            ↓ fails / not running
          DeepSeek V3 (if API key configured)
            ↓ fails / no key
          OpenAI gpt-4o-mini (if API key configured)
```

Circuit breaker: opens after 3 consecutive failures, recovers after 60s.

### Local Services

| Service | URL | Purpose |
|---------|-----|---------|
| **Ollama** | http://localhost:11434 | LLM text generation (llama3.2) |
| **ComfyUI** | http://localhost:8188 | Image generation (SD 1.5) |
| **Piper TTS** | Local binary | Text-to-speech |
| **Money Printer Turbo** | http://localhost:8501 | Video generation (optional) |
| **GPT Researcher** | http://localhost:8002 | Real web research for `/app/research` (optional, DuckDuckGo + MINT's Ollama) |

### `/api/research/stream` (WebSocket)

Auth via `?token=` query param (WS handshakes can't carry an `Authorization` header)
verified the same way as the HTTP JWT flow. On a query: tries GPT Researcher first,
streaming `progress` messages and a final `done` message with `report` + `sources`;
on any failure (unreachable, mid-run error) falls back to the same LLM-guess path
`POST /research` always used, tagging the persisted report's `source` as
`gpt-researcher` or `ai-fallback` so the frontend can show which kind of report it is.

## Frontend (React 18 + Vite 6)

### Provider Tree (main.tsx)

```tsx
<ThemeProvider>          ← dark/light mode, CSS class on <html>
  <QueryClientProvider>  ← TanStack Query server state
    <BrowserRouter>      ← React Router 7
      <ToastProvider>    ← Toast notifications
        <App />
      </ToastProvider>
    </BrowserRouter>
  </QueryClientProvider>
</ThemeProvider>
```

### Route Structure

```
/                   → redirect to /app/dashboard
/landing            → magic link login (web mode)
/app/*              → AppLayout (sidebar + theme)
  /app/dashboard    → Dashboard (stats, quick actions)
  /app/projects     → Projects (CRUD)
  /app/studio       → ContentGenerator (AI generation)
  /app/research     → Research (live progress, citations, GPT Researcher or LLM-guess)
  /app/library      → Saved content (search, filter, favorites)
  /app/publish      → Publish queue
  /app/files        → Browse the unified output folder
  /app/settings     → Local-service status, Ollama model picker
  *                 → NotFound
```

### Session

```ts
// Dev auto-verify with dummy token
const DESKTOP_SESSION = {
  user: { id: 'dev-user', email: 'user@mint.local', name: 'You' },
  accessToken: 'dev-token',
  expiresAt: <1 year from now>,
};
```

### API Base URL

| Mode | Base URL |
|------|---------|
| Web dev (via Vite proxy) | `/api` |
| `VITE_API_URL` env set | that value (default: `http://localhost:4000/api`) |

## Build Pipeline

### Development

```bash
npm run dev            # Frontend only (Vite :5173)
npm run backend:dev    # Backend only (tsx :4000)
npm run dev:all        # Both (concurrently)
start-mint.bat         # All services (Ollama, ComfyUI, Backend, Frontend)
```

### Production

```bash
npm run build          # TypeScript check + Vite build
npm run backend:build  # esbuild bundle + Prisma copy
```

### Windows Installer

Personal installer (`installer/MINT_Setup_Personal.iss`, ~10MB, source-only — the
active/documented one, see README):
- Ships source only; `npm install` runs on the user's machine post-install
- Auto-detects existing Ollama/ComfyUI/GPT Researcher, downloads missing ones during setup
- Creates desktop shortcut + Start Menu entry (proper app icon, not the .bat default)
- Runs Prisma migrations post-install

`MINT_Setup.iss` / `MINT_Setup_Lite.iss` are older monolithic installers kept for
reference, not the recommended path.

```bash
# Compile the Personal installer (requires Inno Setup 6)
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\MINT_Setup_Personal.iss
```

## Security

- **Helmet**: active, CSP disabled (dev mode)
- **CORS**: allows localhost only in development
- **Rate limiting**: 100 req/min general API
- **JWT**: not used in dev mode (auto-verify with dummy token)

## File Layout

```
MINT/
├── frontend/src/
│   ├── main.tsx              ← Provider tree root
│   ├── App.tsx               ← Routes
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx ← Shell (sidebar + header)
│   │   │   └── AppShell.tsx  ← Sidebar, Header, Logo
│   │   ├── ThemeProvider.tsx ← Dark/light context
│   │   └── ...
│   ├── hooks/
│   │   ├── useSession.ts     ← Auth state (dev bypasses auth)
│   │   ├── useResearchStream.ts ← WS client for /research/stream
│   │   └── useTheme.ts       ← Theme context consumer
│   ├── lib/api/
│   │   ├── fetchWrapper.ts   ← HTTP client
│   │   └── auth.ts           ← Session API + DESKTOP_SESSION
│   └── pages/                ← Dashboard, Studio, Projects, ...
├── backend/
│   ├── src/index.ts          ← Fastify app, schema init, buildApp()
│   ├── src/routes/           ← API route handlers
│   ├── src/services/         ← Business logic (AI, media, etc.)
│   │   └── ai/gptResearcher.service.ts ← WS client for the local GPT Researcher service
│   └── prisma/schema.prisma  ← SQLite schema
├── installer/
│   ├── MINT_Setup_Personal.iss   ← Active installer (source-only, ~10MB)
│   ├── download-ollama.bat       ← Ollama installer helper
│   ├── download-comfyui.bat      ← ComfyUI installer helper
│   └── download-gptresearcher.bat ← GPT Researcher installer helper
├── start-mint.bat            ← Master launcher script
├── stop-mint.bat             ← Stop all services
├── LICENSE                   ← MIT license
└── .env                      ← Root env (DATABASE_URL for Prisma)
```
