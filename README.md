# MINT — AI Content Workstation

A personal AI content generation tool for faceless YouTube channels. Generate scripts, captions, thumbnails, hooks, and scenarios with AI-powered content creation.

## Features

- **AI Content Studio** — Generate scripts, captions, thumbnails, hooks, and video scenarios
- **Multi-Provider AI** — DeepSeek, OpenAI, Ollama with automatic fallback
- **Image Generation** — ComfyUI integration for AI-generated images
- **Voice & Video** — Text-to-speech and short video generation
- **Library** — Save, tag, search, and organize your content
- **Publish Queue** — Schedule and manage content publishing
- **Research** — AI-powered research reports
- **Dashboard** — Overview of your content and AI usage
- **Cost Tracking** — Monitor AI API spending
- **Keyboard Shortcuts** — Ctrl+G generate, Ctrl+S save, Ctrl+Shift+K shortcuts

## Tech Stack

- **Frontend**: React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3, TanStack Query 5
- **Backend**: Fastify 4, TypeScript 5.7, Prisma 6, PostgreSQL
- **AI**: DeepSeek → OpenAI → Ollama fallback chain
- **Media**: ComfyUI (images), MoneyPrinterTurbo (video), Edge TTS (voice)

## Quick Start

```bash
# Clone and install
git clone https://github.com/Thatisshayan/Mint.git
cd Mint
npm install && cd backend && npm install && cd ..

# Set up database
docker-compose up -d postgres
npm run db:generate

# Configure AI (edit backend/.env)
cp backend/.env.example backend/.env

# Start development
npm run dev:all
```

Open http://localhost:5173

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) — Setup guide
- [AI Providers](docs/AI_PROVIDERS.md) — Configure DeepSeek, OpenAI, Ollama
- [Keyboard Shortcuts](docs/KEYBOARD_SHORTCUTS.md) — Shortcuts reference

## Development

```bash
npm run dev:all          # Start backend + frontend
npm run build            # Build frontend
npm run backend:build    # Build backend
npm run test             # Run tests
npm run lint             # Lint code
npm run format           # Format code
```

## License

MIT
