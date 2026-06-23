# MINT — AI Content Workstation

## Stack

- **Frontend**: React 18, TypeScript 5.7, Vite 6, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 3, shadcn/ui, Framer Motion 12
- **Backend**: Node.js, Fastify 4, TypeScript 5.7, Prisma 6, PostgreSQL, JWT auth, magic-link email
- **DB**: PostgreSQL via Prisma ORM (4 models: User, ContentProject, GeneratedPost, ResearchReport)

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
└── backend/prisma/
    └── schema.prisma    # DB schema
```

## Commands

| Command | Description |
|---------|-------------|
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

- Backend: `backend/.env` — DATABASE_URL, JWT_SECRET, SMTP_*, COMFYUI_*
- Frontend: `frontend/.env` — VITE_API_URL

## Auth

- Magic-link email auth (dev-only, no real SMTP configured)
- JWT tokens via @fastify/jwt
- RouteGuard component for protected frontend routes
- Auth middleware for protected backend routes

## Status

Early MVP scaffold. Core AI features (OpenAI, ComfyUI) are stubs. CI is in place. Need tests and Docker. 15 bugs found in latest audit, most fixed.
