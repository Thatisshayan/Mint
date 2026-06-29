# MINT — AI Content Workstation

A personal AI content workstation for faceless YouTube channels. Generate scripts, captions, hooks, thumbnails, research reports, and more — all running locally with no cloud dependency.

## What It Does

| Feature | Description |
|---------|-------------|
| **AI Studio** | Generate scripts, captions, thumbnails, hooks, video scenarios via Ollama (local) |
| **Research** | AI-powered research reports with competitor analysis |
| **Projects** | Organize content into projects with status tracking |
| **Library** | Save, tag, search, and favorite generated content |
| **Publish Queue** | Schedule and manage content publishing |
| **Dashboard** | Overview of recent activity, platform stats, quick actions |
| **Dark/Light Mode** | System-aware theme toggle |
| **Keyboard Shortcuts** | `Ctrl+G` generate, `Ctrl+S` save, `Ctrl+Shift+K` shortcuts modal |

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

### Option 1: Windows Installer (Recommended)

Download [`MINT_Setup_0.2.0.exe`](https://github.com/Thatisshayan/Mint/releases/download/v0.2.0/MINT_Setup_0.2.0.exe) from [Releases](https://github.com/Thatisshayan/Mint/releases/tag/v0.2.0). The smart installer:

- Detects existing Ollama/ComfyUI installations
- Downloads missing AI services automatically
- Creates desktop shortcut and Start Menu entry
- Runs Prisma migrations on first launch

### Option 2: Manual Install

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

## Local AI Services

| Service | Port | Purpose | Setup |
|---------|------|---------|-------|
| **Ollama** | 11434 | LLM text generation | Already installed (llama3.2) |
| **ComfyUI** | 8188 | Image generation | Installed at `D:\AgentDevWork\Programs\comfyui\` |
| **Piper TTS** | — | Text-to-speech | Installed at `D:\AgentDevWork\Programs\piper-tts\` |
| **Money Printer Turbo** | 8501 | Video generation | (Optional) Clone to `D:\AgentDevWork\Programs\money-printer-turbo\` |

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

- **Ollama**: Running with llama3.2 (2GB VRAM, fits RTX 2060)
- **ComfyUI**: Running with SD 1.5 model (~4GB VRAM)
- **Piper TTS**: Installed with en_US-amy-medium voice
- **Backend**: Running on http://localhost:4000
- **Frontend**: Running on http://localhost:5173

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
