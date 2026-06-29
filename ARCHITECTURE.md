# MINT Architecture

**Desktop-first, no-cloud-required AI content workstation.**

## Overview

```
┌─────────────────────────────────────────────────────┐
│                   Tauri 2 Shell                     │
│  (Rust process — manages window, IPC, app lifecycle) │
│                                                     │
│  ┌─────────────┐       ┌──────────────────────────┐ │
│  │  WebView2   │  IPC  │  Sidecar: node server.cjs│ │
│  │  (frontend) │◄─────►│  Fastify 5 on :19421     │ │
│  │  React SPA  │       │  Prisma → SQLite          │ │
│  └─────────────┘       └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │ HTTP fetch                │ file I/O
         │ http://localhost:19421    │
         ▼                           ▼
   External AI APIs           %APPDATA%\com.mint.app\
   (DeepSeek / OpenAI)        mint.db (SQLite)
```

## Runtime Modes

| Mode | Frontend URL | Backend | Auth |
|------|-------------|---------|------|
| **Desktop (Tauri)** | `tauri://localhost` | `localhost:19421` (sidecar) | Bypassed — hardcoded `desktop-user` |
| **Web dev** | `http://localhost:5173` | `http://localhost:19421` | Magic link (dev auto-verify) |

## Desktop Startup Sequence

```
1. Tauri launches
2. Rust: find_node() — searches PATH, C:\Program Files\nodejs\, nvm-windows
3. Rust: spawn node.exe server.cjs as a child process
   - MINT_DESKTOP=true
   - PORT=19421
   - PRISMA_QUERY_ENGINE_LIBRARY=<resources>/node_modules/.prisma/client/query_engine-windows.dll.node
4. Rust: poll http://localhost:19421/health every 500ms (up to 45s)
5. WebView2 loads tauri://localhost (bundled frontend assets)
6. Frontend: detects window.__TAURI_INTERNALS__ → desktop mode
7. Frontend: skips auth → renders Dashboard directly
```

## Backend (Fastify 5)

### Entry Point
`backend/src/index.ts` → bundled to `backend/dist/server.cjs` via esbuild

### Startup
On first launch, `start()` runs `CREATE TABLE IF NOT EXISTS` for all models (no `prisma migrate` needed in bundled mode), then upserts the `desktop-user` row.

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

Desktop mode (`MINT_DESKTOP=true`): any request with `Authorization: Bearer desktop-token` is auto-authenticated as `desktop-user` — no JWT verification.

Web mode: standard `@fastify/jwt` verification.

### Database

SQLite via Prisma 6. Schema: `backend/prisma/schema.prisma`.

Models: `User`, `ContentProject`, `GeneratedPost`, `ResearchReport`, `Template`, `MagicLinkToken`

DB file location (desktop): `%APPDATA%\com.mint.app\mint.db`

### AI Provider Chain

```
Request → DeepSeek V3 (primary, cheapest)
            ↓ fails / no key
          OpenAI gpt-4o-mini
            ↓ fails / no key
          Ollama (local — llama3.1:8b or similar)
```

Circuit breaker: opens after 3 consecutive failures, recovers after 60s.

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
/landing            → magic link login (web mode only)
/app/*              → AppLayout (sidebar + theme)
  /app/dashboard    → Dashboard (stats, quick actions)
  /app/projects     → Projects (CRUD)
  /app/studio       → ContentGenerator (AI generation)
  /app/research     → Research reports
  /app/library      → Saved content (search, filter, favorites)
  /app/publish      → Publish queue
  *                 → NotFound
```

### Desktop Detection

```ts
const isDesktop = () =>
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
```

Used in: `fetchWrapper.ts` (API base URL), `useSession.ts` (skip auth), `auth.ts` (return DESKTOP_SESSION).

### Session (Desktop)

```ts
const DESKTOP_SESSION = {
  user: { id: 'desktop-user', email: 'user@mint.local', name: 'You' },
  accessToken: 'desktop-token',
  expiresAt: <1 year from now>,
};
```

No localStorage reads. `signOut()` is a no-op.

### API Base URL

| Mode | Base URL |
|------|---------|
| Desktop | `http://localhost:19421/api` |
| Web dev (via Vite proxy) | `/api` |
| `VITE_API_URL` env set | that value |

## Build Pipeline

### `npm run tauri:build` triggers:

```
1. beforeBuildCommand:
   a. prisma generate --schema backend/prisma/schema.prisma
   b. node backend/bundle.mjs
      - esbuild: backend/src/index.ts → backend/dist/server.cjs
      - Copy @prisma/client → backend/dist/@prisma/client (skip wasm)
      - Copy .prisma/client → backend/dist/.prisma/client (includes query_engine-windows.dll.node)
   c. tsc -b && vite build → frontend/dist/

2. Tauri bundles:
   - frontend/dist/ → WebView2 assets
   - backend/dist/ → resources/backend/dist/ (inside MSI)
   - Windows MSI → src-tauri/target/release/bundle/msi/
```

### Prisma in Bundled Mode

`@prisma/client` is marked external in esbuild (CJS incompatibility). The generated client and native query engine DLL are copied alongside `server.cjs`. `PRISMA_QUERY_ENGINE_LIBRARY` env var points to the DLL at runtime.

## Security

- **CSP**: `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* https:; ...`
- **Helmet**: active, CSP disabled (managed by Tauri)
- **CORS**: desktop mode allows `localhost:*` only
- **Rate limiting**: disabled in desktop mode
- **JWT**: not used in desktop mode (replaced by hardcoded session)

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
│   │   ├── useSession.ts     ← Auth state (desktop bypasses auth)
│   │   └── useTheme.ts       ← Theme context consumer
│   ├── lib/api/
│   │   ├── fetchWrapper.ts   ← HTTP client + desktop URL routing
│   │   └── auth.ts           ← Session API + DESKTOP_SESSION
│   └── pages/                ← Dashboard, Studio, Projects, ...
├── backend/
│   ├── src/index.ts          ← Fastify app, schema init, buildApp()
│   ├── bundle.mjs            ← esbuild + Prisma copy script
│   ├── dist/                 ← Built output (server.cjs + Prisma)
│   └── prisma/schema.prisma  ← SQLite schema
└── src-tauri/
    ├── src/lib.rs            ← find_node(), start_backend(), wait_for_backend()
    └── tauri.conf.json       ← withGlobalTauri, CSP, bundle resources
```
