# MINT — AI Content Workstation

A personal AI content workstation for faceless YouTube channels. Generate scripts, captions, hooks, thumbnails, research reports, and more — all running locally with no cloud dependency.

## What It Does

| Feature | Description |
|---------|-------------|
| **AI Studio** | Generate scripts, captions, thumbnails, hooks, scenarios via Ollama (local) |
| **Settings Page** | Pick which Ollama model to use; see service health (Ollama/ComfyUI/Piper/Money-Printer); run schema check |
| **Research** | AI-powered research reports with competitor analysis |
| **Projects** | Organize content into projects with status tracking |
| **Library** | Save, tag, search, and favorite generated content |
| **Publish Queue** | Queue generated drafts for review/publish; one-click from Studio |
| **Dashboard** | Overview of recent activity, platform stats, AI usage + cost |
| **Auto OAuth on first run** | Signs you in as a single desktop user; User row auto-provisioned — no setup |

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3, TanStack Query 5, Framer Motion |
| **Backend** | Fastify 5, TypeScript 5.7, Prisma 6, SQLite (local, no server needed) |
| **AI** | Ollama (primary, local) → DeepSeek → OpenAI fallback chain |
| **Image Gen** | ComfyUI with SD 1.5 model (local, GPU-accelerated) |
| **TTS** | Piper TTS (local, offline) or Edge TTS (Microsoft cloud) |
| **Build** | Vite (frontend), tsx (backend), esbuild (optional bundle) |

## Quick Start

### Option 1: Windows Installer (Personal use)

The Personal installer (`MINT_Setup_Personal_*.exe`, ~2.6 MB) is a **portable source-only build**. It:

- Installs source + scripts to `C:\Program Files\MINT\` (writable by user)
- Runs `npm install` for root + backend during install
- Runs `prisma generate` + `prisma migrate deploy` once
- Optionally installs Ollama and/or ComfyUI (tick in wizard)
- On first launch, opens the **Settings page** automatically so you can pick a model

Build it yourself from a developer shell:
```powershell
& 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe' `
  'D:\AgentDevWork\repos\.mint\MINT\installer\MINT_Setup_Personal.iss'
```
Output: `installer/output/MINT_Setup_Personal_<version>.exe`

### Option 2: Manual Install (faster, no install needed)


```bash
git clone https://github.com/Thatisshayan/Mint.git
cd Mint
npm install
cd backend && npm install && cd ..
start-mint.bat
```

Or manually:

```bash
npm install
cd backend && npm install && cd ..
ollama serve                                    # Start Ollama (if not running)
node --import tsx/esm backend/src/index.ts      # Start backend on :4000
npx vite --host                                 # Start frontend on :5173
```

Open http://localhost:5173 — click "Continue" to enter (dev auto-auth).

### First Run

After starting the app for the first time, `start-mint.bat` opens **http://localhost:5173/app/settings** automatically. From there:

1. Pick which Ollama model to use (anything installed will be detected).
2. Click **Save selection** — the AI provider now uses that model.
3. (Optional) tick "Install Ollama" / "Install ComfyUI" in the `installer/MINT_Service_Installers` folder if you don't already have them.

The flag file `.first-run-done` in the project root prevents auto-opening the Settings page on subsequent launches. Delete it to re-trigger.

## Local AI Services

| Service | Port | Purpose | Setup |
|---------|------|---------|-------|
| **Ollama** | 11434 | LLM text generation | Auto-discovered: `/api/settings/services` lists installed models. Settings page lets you pick one. |
| **ComfyUI** | 8188 | Image generation | Optional. Set `COMFYUI_BASE_URL` in `.env` to your instance. |
| **Piper TTS** | — | Text-to-speech | Optional. Path configured via `PIPER_EXECUTABLE`. |
| **Money Printer Turbo** | 8501 | Video generation | Optional. Skip if not installed — the Studio Video button gracefully no-ops. |

### Configuration

Edit `backend/.env` to configure local services:

```env
# LLM: Use Ollama locally (no API key needed)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Image generation: Use ComfyUI locally
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188

# TTS: Use Piper locally
TTS_PROVIDER=piper
PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe

# Research: Add Brave Search API key for web research
RESEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=
```

### Services Status

After first boot, the **Settings** page (`/app/settings`) shows live reachability for Ollama, ComfyUI, Money-Printer-Turbo, and Piper. Ollama's installed models are listed there. No need to hand-edit `.env` unless your services live at non-default ports.

### AI Models

The Ollama provider is built to handle "anything that Ollama has installed". On each AI call, the backend will:

1. Call `GET /api/tags` on Ollama (cached 30 s).
2. Pick a model automatically: your saved preference → preferred ordering → smallest installed.
3. Use it for the next call.

To force-pick a model without going through the UI, set `OLLAMA_DEFAULT_MODEL` in `backend/.env` (e.g. `OLLAMA_DEFAULT_MODEL=qwen2.5-coder:7b`).

### Unified Output Folder

By default every artifact MINT produces lands under **`<your home>/MINT-output/`**. Override with `OUTPUT_BASE_DIR` in `backend/.env`.

```
MINT-output/
├── text/         Saved text exports (.txt, .md, .json)
├── audio/        TTS voiceovers (.mp3)
├── video/        Video assembly outputs (.mp4) and Money-Printer outputs
├── transcripts/  Whisper transcripts (.json)
├── images/
│   └── comfyui/  ComfyUI's own output dir redirects here (configure COMFYUI's --output-directory)
└── exports/      Full DB export (.json) drops here too
```

Browse them in-app at `/app/files` or list them via:
```
GET  /api/files                    # listing
GET  /api/files/_config           # active output root path
GET  /api/files/audio/{filename}  # download a single file (auth required)
```

Subfolders are created lazily on first write. Each save returns both an inline data URL (so the UI can still play / render immediately) and a `fileUrl` like `/api/files/audio/1720000000-aabbccdd.mp3`.


## Commands Reference

| Command | Description |
|---------|-------------|
| `start-mint.bat` | Start all services (Ollama, ComfyUI, Backend, Frontend) |
| `stop-mint.bat` | Stop all MINT services |
| `npm run dev` | Start Vite frontend only (:5173) |
| `npm run backend:dev` | Start backend with tsx watch |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint check |
| `npm run db:generate` | Run Prisma migrations + seed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Run Prisma dev migrations |
| `npm run db:seed` | Run Prisma seed |
| `npm run format` | Prettier format |

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) — Full setup guide
- [Architecture](ARCHITECTURE.md) — System design and data flow
- [Ground Truth](GROUND_TRUTH.md) — Current state, known issues, sprint history
- [API Contract](docs/API_CONTRACT.md) — Backend API reference
- [AI Providers](docs/AI_PROVIDERS.md) — Configure AI keys

## License

MIT
