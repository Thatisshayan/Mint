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
| `/api/research/*` | AI research reports CRUD |
| `/api/library/*` | GeneratedPost CRUD + search + favorites |
| `/api/publish/*` | Publish queue CRUD |
| `/api/templates/*` | Template CRUD |
| `/api/export/*` | Full export / restore |

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
  /app/research     → Research reports
  /app/library      → Saved content (search, filter, favorites)
  /app/publish      → Publish queue
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
│   │   └── useTheme.ts       ← Theme context consumer
│   ├── lib/api/
│   │   ├── fetchWrapper.ts   ← HTTP client
│   │   └── auth.ts           ← Session API + DESKTOP_SESSION
│   └── pages/                ← Dashboard, Studio, Projects, ...
├── backend/
│   ├── src/index.ts          ← Fastify app, schema init, buildApp()
│   ├── src/routes/           ← API route handlers
│   ├── src/services/         ← Business logic (AI, media, etc.)
│   └── prisma/schema.prisma  ← SQLite schema
├── start-mint.bat            ← Master launcher script
└── .env                      ← Root env (DATABASE_URL for Prisma)
```
