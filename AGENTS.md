# MINT — AI Content Workstation

## Stack

- **Frontend**: React 18, TypeScript 5.7, Vite 6, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 3, shadcn/ui, Framer Motion 12
- **Backend**: Node.js, Fastify 5, TypeScript 5.7, Prisma 6, SQLite, JWT auth, magic-link email
- **DB**: SQLite via Prisma ORM (5 models: User, ContentProject, GeneratedPost, ResearchReport, Template)
- **AI**: Ollama (primary, local, auto-discovered) → DeepSeek → OpenAI fallback chain
- **Image Gen**: ComfyUI with SD 1.5 model (local, GPU-accelerated, optional)
- **TTS**: Piper TTS (local, optional) or Edge-TTS (online fallback)

## Project structure

```
MINT/
├── frontend/src/
│   ├── pages/           # Landing, Dashboard, Projects, Studio, Research, Library, Publish, Settings, NotFound
│   ├── components/
│   │   ├── layout/      # AppShell (sidebar + header), AppLayout, RouteGuard
│   │   └── ui/          # shadcn/ui primitives (Button, Input, Skeleton, Loading)
│   ├── hooks/           # useSession, useOnlineStatus, useKeyboardShortcuts, useTheme, useDesktop
│   ├── stores/          # TanStack-Query hooks (library, projects, publish, research, studio, templates)
│   ├── context/         # themeContext, toastContext
│   └── lib/api/         # fetchWrapper, client, auth
├── backend/src/
│   ├── index.ts         # Fastify server entry (CORS/JWT/Helmet/Rate-limit + pragmatic raw-SQL fallback if `prisma migrate` is unavailable)
│   ├── routes/          # auth, projects, research, studio, library, publish, template, export, settings
│   ├── services/        # Business logic; services/ai holds Ollama/OpenAI-compatible/Money-Printer/etc.
│   ├── middleware/      # auth.ts (JWT middleware + auto-provision User on first request)
│   └── lib/             # errors.ts, circuitBreaker.ts, logger.ts
├── installer/
│   ├── MINT_Setup_Personal.iss   # Portable source-only installer (~2.6 MB, bakes source + scripts only)
│   ├── MINT_Setup.iss            # Older monolithic installer (kept for reference)
│   ├── MINT_Setup_Lite.iss       # Source-only variant
│   ├── download-ollama.bat       # Optional: downloads Ollama installer during setup
│   └── download-comfyui.bat      # Optional: clones ComfyUI + pulls SD 1.5
└── backend/prisma/
    ├── schema.prisma             # 5 models
    └── migrations/               # Single `init` migration; raw-SQL fallback in index.ts covers fresh installs
```

## Commands

| Command | Description |
|---------|-------------|
| `start-mint.bat` | Start all services (Ollama, ComfyUI, Backend, Frontend). On first run opens `/app/settings` automatically. |
| `stop-mint.bat` | Stop all MINT services |
| `npm run dev` | Start Vite dev server (frontend) |
| `npm run backend:dev` | Start backend with tsx watch |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint check |
| `npm run db:generate` | Run Prisma migrations + seed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Run Prisma dev migrations |
| `npm run db:seed` | Run Prisma seed |
| `npm run format` | Prettier format |
| `npm run backend:build` | Bundle backend + run `prisma generate` |
| `npm run tauri` / `tauri:dev` / `tauri:build` | Desktop builds (Tauri 2) |

## Conventions

- ES modules throughout (`"type": "module"`)
- TypeScript strict mode (`tsconfig.json`); `tsconfig.app.json` is intentionally lax for Vite/React ergonomics
- Fastify backend with JWT auth middleware (`backend/src/middleware/auth.ts`)
- Auto-provisioning: the first time a request lands with a JWT, the middleware upserts a `User` row keyed on the JWT `sub`/`email` so every later `INSERT` succeeds without manual onboarding
- Frontend uses TanStack Query for server state (not Zustand — `stores/` files are hook wrappers, not classic zustand stores)
- Prisma for DB access, Zod for validation
- shadcn/ui components in `frontend/src/components/ui/`
- Vite proxy `/api` -> `localhost:4000` (configured in `vite.config.ts`)
- Circuit breakers around each AI provider (1 minute recovery, 3-failure threshold)
- Cost tracking writes JSONL to `backend/logs/ai-usage.jsonl` (created on demand)

## Env

- Backend: `backend/.env` — `JWT_SECRET`, `LLM_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_DEFAULT_MODEL`, `COMFYUI_BASE_URL`, `MONEY_PRINTER_BASE_URL`, `TTS_BASE_URL`/`EDGE_TTS_API`, `PIPER_EXECUTABLE`, `PIPER_VOICE_DIR`, `DATABASE_URL`, `DISABLE_AUTH`, `BRAVE_SEARCH_API_KEY`, `RESEARCH_PROVIDER`, `OUTPUT_BASE_DIR` (single artifact folder, default `<USERPROFILE>\MINT-output`), `LANG` (optional)
- Frontend: `frontend/.env` — `VITE_API_URL` (defaults to `/api`; `19421` for desktop bundle)
- Prisma: `backend/prisma/.env` — `DATABASE_URL`

## Output Layout

By convention every file MINT writes goes under `OUTPUT_BASE_DIR` with these subfolders:

| Subdir | Contents |
|---|---|
| `text/` | Saved text exports (.txt, .md, .json) |
| `audio/` | TTS voiceovers (.mp3) — both data URL and disk file |
| `video/` | ffmpeg assembly output + Money-Printer outputs (.mp4) |
| `transcripts/` | Whisper transcription JSON |
| `images/comfyui/` | ComfyUI's own writes — point ComfyUI's `--output-directory` here |
| `exports/` | Full DB JSON backups from the Dashboard |

Each save via `services/outputPaths.ts → saveMintBlob(subdir, ext, data)` creates the dir lazily and returns `{ absolutePath, filename, publicUrl: "/api/files/<subdir>/<name>" }`.

Backend exposes:
- `GET /api/files` — listing grouped by subdir
- `GET /api/files/:subdir/:name` — single-file download (auth required, sanitized name, root-prefix guard against traversal)
- `GET /api/files/_config` — the resolved output root, for the UI to show the user

## Local Services

- **Ollama**: http://localhost:11434 — discovered at runtime via `/api/tags`; not hardcoded to any model
- **ComfyUI**: http://localhost:8188 (optional) — only needed for `Generate Image`
- **Piper TTS**: `D:\AgentDevWork\Programs\piper-tts\piper.exe` (optional) — speech synthesis
- **Money Printer Turbo**: http://localhost:8501 (optional) — video assembly

## Auth

- Magic-link email auth (dev-only, no real SMTP configured). The frontend `Landing.tsx` dev-bypasses by hardcoding `'dev-token'` for `verifyMagicLink`.
- JWT tokens via `@fastify/jwt`; signing fallback in `utils/jwt.ts` matches `config.ts`'s fallback secret so tokens round-trip in dev.
- Single-user mode: set `DISABLE_AUTH=true` in `.env` → middleware injects a `single-user` row; `index.ts` auto-seeds the matching `User(id='desktop-user')`.
- RouteGuard component for protected frontend routes
- Auto-provisioning in middleware means new tokens work without a separate "create account" step.

## Status (June 2026)

Working MVP. End-to-end smoke-tested on local Ollama with 6 models (`qwen2.5-coder:7b`, `qwen2.5:3b`, `llama3.2:latest`, `llama3.2:3b`, `mistral:latest`, `qwen3.6:latest`) plus Piper TTS.

Backend now exposes a single `/api/settings/services` endpoint that reports reachability of every integrated service and lists installed Ollama models. There's a Settings page (`/app/settings`) that lets you pick the model and run a schema check.

### Build the windows installer (portable, source-only)

```powershell
& 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe' installer\MINT_Setup_Personal.iss
# Output: installer\output\MINT_Setup_Personal_0.3.0.exe
```

This pulls all source + scripts (Python-like build for npm), but does NOT bundle `node_modules` — they install on the user's machine. Result is ~2.6 MB instead of the legacy 88 MB monolithic build.
