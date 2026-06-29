# MINT — AI Content Workstation

## Stack

- **Frontend**: React 18, TypeScript 5.7, Vite 6, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 3, shadcn/ui, Framer Motion 12
- **Backend**: Node.js, Fastify 5, TypeScript 5.7, Prisma 6, SQLite, JWT auth, magic-link email
- **DB**: SQLite via Prisma ORM (5 models: User, ContentProject, GeneratedPost, ResearchReport, Template)
- **AI**: Ollama (primary, local) → DeepSeek → OpenAI fallback chain
- **Image Gen**: ComfyUI with SD 1.5 model (local, GPU-accelerated)
- **TTS**: Piper TTS (local, offline)

## Project structure

```
MINT/
├── frontend/src/
│   ├── pages/           # Landing, AppHome, Projects, Studio, Research, Library, Publish, NotFound
│   ├── components/
│   │   ├── layout/      # AppShell (sidebar + header), RouteGuard
│   │   └── ui/          # shadcn/ui primitives
│   ├── hooks/           # useSession
│   ├── stores/          # Zustand stores (library, projects, publish, research, studio)
│   └── lib/api/         # fetchWrapper, auth, client
├── backend/src/
│   ├── index.ts         # Fastify server entry
│   ├── routes/          # auth, projects, research, studio, library, publish
│   ├── services/        # Business logic
│   ├── middleware/      # auth.ts (JWT middleware)
│   └── utils/           # jwt.ts
├── installer/
│   ├── MINT_Setup.iss   # Inno Setup installer script
│   ├── download-ollama.bat
│   └── download-comfyui.bat
└── backend/prisma/
    └── schema.prisma    # DB schema
```

## Commands

| Command | Description |
|---------|-------------|
| `start-mint.bat` | Start all services (Ollama, ComfyUI, Backend, Frontend) |
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

## Conventions

- ES modules throughout (`"type": "module"`)
- TypeScript strict mode
- Fastify backend with JWT auth middleware
- Zustand for client state, TanStack Query for server state
- Prisma for DB access, Zod for validation
- shadcn/ui components in `frontend/src/components/ui/`
- Vite proxy `/api` -> `localhost:4000`

## Env

- Backend: `backend/.env` — LLM_PROVIDER, OLLAMA_BASE_URL, COMFYUI_BASE_URL, etc.
- Frontend: `frontend/.env` — VITE_API_URL
- Prisma: `backend/prisma/.env` — DATABASE_URL

## Local Services

- **Ollama**: http://localhost:11434 (llama3.2, 2GB VRAM)
- **ComfyUI**: http://localhost:8188 (SD 1.5 model, ~4GB VRAM)
- **Piper TTS**: `D:\AgentDevWork\Programs\piper-tts\piper.exe`

## Auth

- Magic-link email auth (dev-only, no real SMTP configured)
- JWT tokens via @fastify/jwt
- RouteGuard component for protected frontend routes
- Auth middleware for protected backend routes

## Status

Working MVP with local AI services (Ollama, ComfyUI, Piper TTS). Backend starts on port 4000. Frontend starts on port 5173. All AI features run locally — no cloud API keys needed for basic usage.
