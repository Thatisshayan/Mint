# MINT — AI Content Workstation

Self-hosted faceless content creation platform. Generate scripts, captions, thumbnails, voiceovers, and videos — all driven by AI. Built for YouTube Shorts creators, Instagram reel makers, and digital content producers.

## Features

- **AI Content Generation** — Scripts, captions, thumbnails, hooks, scenarios via DeepSeek/Ollama/OpenAI (interchangeable providers)
- **Image Generation** — ComfyUI integration for AI image generation
- **Voiceover** — Edge TTS speech synthesis from any script text
- **Video Generation** — MoneyPrinterTurbo Docker sidecar for automated short-form video creation
- **Stock Footage** — Pexels API integration for royalty-free video clips
- **Video Assembly** — FFmpeg-based clip concatenation with audio overlay
- **Transcription** — Local Whisper model for audio-to-text
- **Research Tool** — AI-powered competitive analysis and topic research
- **Library** — Saved content management with PostgreSQL persistence
- **Publish Queue** — Content scheduling and queue management
- **Custom Green Theme** — Mint palette with dark/light mode toggle
- **Auth** — Magic link authentication with JWT (dev-mode, SMTP-ready)
- **Railway Deployable** — Dockerfile + railway.json for one-command deployment

## Stack

```
Frontend:  React 18 + TypeScript 5.7 + Vite 6 + Tailwind CSS 3 + shadcn/ui
State:     TanStack Query 5 (server) + Zustand 5 (client)
Forms:     React Hook Form + Zod
Animation: Framer Motion 12
Backend:   Fastify 4 + TypeScript 5.7
Auth:      @fastify/jwt (HMAC-SHA256) + magic-link email
DB:        PostgreSQL 16 + Prisma 6 ORM
AI:        DeepSeek (primary) / Ollama (fallback) / OpenAI (optional)
Media:     ComfyUI (image gen) / MoneyPrinterTurbo (video gen, Docker sidecar) / Edge TTS (voiceover)
           Pexels (stock footage) / FFmpeg (video assembly) / Whisper (transcription)
```

## Quick Start

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET, DEEPSEEK_API_KEY

# 3. Run database migrations
npm run db:migrate

# 4. Start both frontend + backend
npm run dev          # Terminal 1: Vite dev server (:5173)
npm run backend:dev  # Terminal 2: Fastify backend (:4000)
```

### Railway Deployment
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and link
railway login
railway link

# 3. Add PostgreSQL plugin
railway plugin add postgresql

# 4. Set environment variables
railway env set JWT_SECRET=your-secret DEEPSEEK_API_KEY=sk-...

# 5. Deploy
railway up
```

## Project Structure
```
MINT/
├── frontend/src/
│   ├── pages/           # Landing, Projects, Studio, Research, Library, Publish, NotFound
│   ├── components/
│   │   ├── layout/      # AppShell (sidebar + header), AppLayout
│   │   ├── ui/          # shadcn/ui primitives + custom (Button, Input, Loader, Skeleton)
│   │   ├── ContentGenerator.tsx, RouteGuard.tsx, ThemeProvider.tsx, ErrorBoundary.tsx
│   ├── hooks/           # useSession
│   ├── stores/          # Zustand stores (library, projects, publish, research, studio)
│   ├── styles/          # globals.css (mint green theme)
│   └── lib/api/         # fetchWrapper, auth, client
├── backend/src/
│   ├── index.ts         # Fastify server entry
│   ├── routes/          # auth, projects, research, studio, library, publish
│   ├── services/
│   │   └── ai/          # openai, comfyui, tts, video, pexels, whisper, assembly
│   ├── middleware/       # auth.ts (JWT middleware)
│   └── utils/           # jwt.ts
├── backend/prisma/      # Schema + migrations (PostgreSQL)
├── railway.json         # Railway deployment config
└── docker-compose.yml   # MINT + MoneyPrinterTurbo sidecar
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `DEEPSEEK_API_KEY` | Yes (primary) | DeepSeek API key |
| `OLLAMA_BASE_URL` | No | Local Ollama URL (default: http://localhost:11434) |
| `OPENAI_API_KEY` | No | OpenAI API key (alternative provider) |
| `COMFYUI_BASE_URL` | No | Local ComfyUI URL (default: http://localhost:8188) |
| `MPT_BASE_URL` | No | MoneyPrinterTurbo API URL (default: http://localhost:10010) |
| `PEXELS_API_KEY` | No | Pexels API key for stock footage |
| `LLM_PROVIDER` | No | Provider selection: deepseek/ollama/openai (default: deepseek) |
| `SMTP_HOST/PORT/USER/PASS` | No | Email config for production magic links |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend) |
| `npm run backend:dev` | Start backend with tsx watch |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint check |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Run Prisma seed |
| `npm run format` | Prettier format |
| `railway up` | Deploy to Railway |

## Status

All 5 phases complete — fully functional MVP. See GROUND_TRUTH.md and ARCHITECTURE.md for details.
