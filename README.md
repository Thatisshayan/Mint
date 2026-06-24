# MINT — AI Content Workstation

Self-hosted faceless content creation platform. Generate scripts,
captions, thumbnail prompts, and soon videos — all driven by AI.

## Stack
- Frontend: React 18, TypeScript 5.7, Vite 6, Tailwind CSS 3, shadcn/ui, TanStack Query 5, Zustand 5, Framer Motion 12
- Backend: Node.js, Fastify 4, TypeScript 5.7, Prisma 6, PostgreSQL, JWT auth
- AI: DeepSeek API, Ollama (local), ComfyUI (local images), MoneyPrinterTurbo (coming)

## Quick Start
1. `npm install` (root installs frontend + backend deps)
2. Copy `backend/.env.example` to `backend/.env`
3. Set `DATABASE_URL` to your PostgreSQL connection string
4. Run `npm run db:migrate` to set up tables
5. Run `npm run dev` for frontend + `npm run backend:dev` for backend
6. Open http://localhost:5173

## Project Structure
```
MINT/
├── frontend/src/
│   ├── pages/        # Landing, Projects, Studio, Library, Publish, NotFound
│   ├── components/   # UI components, layout, error boundary
│   ├── hooks/        # useSession
│   ├── stores/       # Zustand stores (library, projects, publish, research, studio)
│   └── lib/api/      # fetchWrapper, auth, client
├── backend/src/
│   ├── index.ts      # Fastify server entry
│   ├── routes/       # auth, projects, research, studio, library, publish
│   ├── services/     # Business logic + AI providers
│   ├── middleware/    # JWT auth middleware
│   └── utils/        # JWT utilities
└── backend/prisma/   # Schema + migrations (PostgreSQL)
```

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend) |
| `npm run backend:dev` | Start backend with tsx watch |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint check |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run format` | Prettier format |

## Environment Variables
Configure in `backend/.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for JWT signing
- `DEEPSEEK_API_KEY` — DeepSeek API key (primary AI)
- `OLLAMA_BASE_URL` — Local Ollama URL (fallback AI)
- `COMFYUI_BASE_URL` — Local ComfyUI URL (image generation)
- `SMTP_*` — Email config (for production magic links)

## Status
Early MVP — core AI pipeline being built. See GROUND_TRUTH.md and TODO.md.
