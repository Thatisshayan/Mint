# MINT — AI Content Workstation

A personal AI content workstation for faceless YouTube channels, packaged as a native Windows desktop app (Tauri 2). Generate scripts, captions, hooks, thumbnails, research reports, and publish queues — all running locally with no cloud dependency.

## What It Does

| Feature | Description |
|---------|-------------|
| **AI Studio** | Generate scripts, captions, thumbnails, hooks, video scenarios via DeepSeek / OpenAI / Ollama |
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
| **Desktop Shell** | Tauri 2 (Rust + WebView2) — Windows MSI installer |
| **Frontend** | React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3, TanStack Query 5, Framer Motion |
| **Backend** | Fastify 5, TypeScript 5.7, Prisma 6, SQLite (local, no server needed) |
| **AI** | DeepSeek V3 → OpenAI → Ollama fallback chain |
| **Media** | ComfyUI (images), Edge TTS (voice), Pexels (stock footage), FFmpeg (assembly) |
| **Build** | esbuild (backend bundle), Vite (frontend), Tauri (native shell + MSI) |

## Desktop App (Windows)

### Install

Download and run `MINT_0.1.0_x64_en-US.msi` from the [latest release](https://github.com/Thatisshayan/Mint/releases).

MINT installs to `D:\Program Files\MINT\` and opens directly to the Dashboard — no login required.

### How It Works

- Tauri starts a local Fastify server on `localhost:19421` at launch
- The server uses SQLite at `%APPDATA%\com.mint.app\mint.db` — all data stays on your machine
- Node.js must be installed on your system (the app discovers it automatically via PATH or common install paths)
- The backend bundle (`server.cjs`) and Prisma query engine are included in the installer

### Requirements

- Windows 10/11 x64
- Node.js 18+ (download from https://nodejs.org)
- WebView2 Runtime (usually pre-installed on Windows 11; otherwise auto-installed by MSI)

## Development Setup

### Prerequisites

- Node.js 20+
- Rust + `cargo` (for Tauri)
- `npm`

### Install

```bash
git clone https://github.com/Thatisshayan/Mint.git
cd Mint
npm install
cd backend && npm install && cd ..
```

### Configure AI

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DEEPSEEK_API_KEY=your-key      # cheapest + best
# OPENAI_API_KEY=your-key      # fallback
# OLLAMA_BASE_URL=http://localhost:11434  # free, local
JWT_SECRET=any-random-string
PORT=19421
```

### Start Dev

```bash
npm run tauri:dev       # Tauri desktop app (hot reload)
# OR
npm run dev:all         # Web mode: backend :19421 + frontend :5173
```

### Build MSI

```bash
npm run tauri:build     # outputs src-tauri/target/release/bundle/msi/MINT_0.1.0_x64_en-US.msi
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run tauri:dev` | Tauri desktop dev (hot reload) |
| `npm run tauri:build` | Build Windows MSI installer |
| `npm run dev` | Vite frontend only (:5173) |
| `npm run dev:all` | Backend + frontend (web mode) |
| `npm run build` | Build frontend bundle |
| `npm run backend:build` | Bundle backend with esbuild + Prisma |
| `npm run backend:start` | Run bundled backend directly |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) — Full setup guide
- [Architecture](ARCHITECTURE.md) — System design and data flow
- [Ground Truth](GROUND_TRUTH.md) — Current state, known issues, sprint history
- [API Contract](docs/API_CONTRACT.md) — Backend API reference
- [AI Providers](docs/AI_PROVIDERS.md) — Configure AI keys

## License

MIT
