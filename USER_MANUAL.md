# MINT User Manual

> **MINT** — Personal AI Content Workstation for Faceless YouTube Channels
> Version: 0.2.0 | Last updated: June 2026

---

## Table of Contents

1. [What MINT Does](#what-mint-does)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [How to Run](#how-to-run)
4. [Authentication](#authentication)
5. [Dashboard](#dashboard)
6. [Studio (AI Generation)](#studio-ai-generation)
7. [Library (Content Storage)](#library-content-storage)
8. [Research](#research)
9. [Projects](#projects)
10. [Publish](#publish)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [AI Providers & Configuration](#ai-providers--configuration)
13. [Media Generation (Images, Voice, Video)](#media-generation-images-voice-video)
14. [Data & Export](#data--export)
15. [Troubleshooting](#troubleshooting)
16. [Known Limitations](#known-limitations)

---

## What MINT Does

MINT is a personal tool for creating faceless YouTube channel content. It helps you:

- **Generate AI content**: Scripts, hooks, captions, thumbnail prompts, and scenarios using Ollama (local, free)
- **Organize content**: Save, tag, favorite, and search generated content in a library
- **Create media**: Voiceover audio (Piper TTS), short videos (MoneyPrinterTurbo), and thumbnail images (ComfyUI)
- **Research topics**: AI-assisted research reports for content ideas
- **Manage projects**: Group content by project/channel
- **Track costs**: Monitor AI token usage and estimated costs
- **Publish**: Schedule and queue content for publishing

MINT is built for **personal use only** — single user, no multi-user support, no SaaS features.

---

## Prerequisites & Setup

### Required Software

- **Node.js** 18+ (for running the backend)
- **Ollama** (for local AI text generation — already installed)

### Optional External Services

| Service | Purpose | Required? |
|---------|---------|-----------|
| Ollama | Local AI text generation (free) | Recommended — installed with llama3.2 |
| ComfyUI | AI image generation | Optional — installed with SD 1.5 |
| Piper TTS | Text-to-speech (offline) | Optional — installed |
| MoneyPrinterTurbo | AI video generation | Optional — separate install |

### Environment Variables

Create `backend/.env`:

```env
# LLM: Use Ollama locally (no API key needed)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Image generation: Use ComfyUI
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188

# TTS: Use Piper
TTS_PROVIDER=piper
PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe

# JWT Secret (required for auth)
JWT_SECRET="your-random-secret-string-here"

# Research: Add Brave Search API key for web research
RESEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:4000/api"
```

---

## How to Run

### Option 1: Start All Services (Recommended)

```bash
start-mint.bat
```

This starts Ollama, ComfyUI, Backend, and Frontend.

### Option 2: Manual Start

```bash
# 1. Start Ollama (if not running)
ollama serve

# 2. Start backend
node --import tsx/esm backend/src/index.ts

# 3. Start frontend
npx vite --host
```

### Option 3: Development Mode

```bash
npm run dev:all    # Backend + frontend concurrently
```

The app will be available at `http://localhost:5173`.

---

## Authentication

MINT uses **magic link authentication** for personal use. In development mode, it auto-verifies with a dummy token.

### How to Sign In

1. Go to http://localhost:5173
2. Enter your email address
3. Click "Continue" or "Launch Mint"
4. You are now logged in (dev auto-authenticates)

---

## Dashboard

The Dashboard (`/app/dashboard`) shows:

- **Quick stats**: Total content items, drafts, published, favorites
- **Recent activity**: Latest generated content
- **AI status**: Which provider is active (Ollama, DeepSeek, or OpenAI)
- **Cost tracking**: Today's/this week's AI usage cost and token count
- **Circuit breaker status**: Health of AI providers (open/closed/half-open)

---

## Studio (AI Generation)

The Studio is the core of MINT. Navigate to `/app/studio`.

### Content Types

| Type | What it generates |
|------|------------------|
| YouTube Script | Full video script with intro, body, outro |
| Instagram Caption | Short caption with hashtags |
| Thumbnail Prompt | AI image generation prompt for a thumbnail |
| Hook | Attention-grabbing opening line |
| Scenario | Story/situation for faceless content |
| Full Package | Script + caption + thumbnail prompt all at once |

### Tone Options

- **Professional**: Formal, authoritative
- **Casual**: Conversational, friendly
- **Educational**: Teaching style, step-by-step
- **Entertaining**: Humorous, engaging, storytelling

### How to Generate Content

1. **Enter a topic** (e.g., "10 productivity tips for remote workers")
2. **Select content type** from the dropdown
3. **Choose tone**
4. **Click "Generate"** or press **Ctrl+G**
5. Wait for AI to complete (usually 5-30 seconds)
6. Review the result in the panel below

### After Generation — Actions Available

- **Copy to clipboard** — copy the raw text
- **Copy as Markdown** — formatted with frontmatter
- **Copy as JSON** — structured data
- **Download as .txt** — save as text file
- **Download as .md** — save as Markdown file
- **Save to library** — store permanently (Ctrl+S)
- **Rate the output** — 1-5 stars (helps prompt A/B testing)

### Auto-Save Drafts

The Studio auto-saves your topic, type, and tone as a draft every 5 seconds. If you refresh the page, your inputs are restored. Drafts are cleared after successful generation.

---

## Library (Content Storage)

Navigate to `/app/library`.

### Features

- **Pagination**: 20 items per page (use Prev/Next buttons)
- **Filter by status**: All / Draft / Published / Archived
- **Favorites**: Toggle to mark items as favorites
- **Search**: Full-text search across content, platform, and tags
- **Tags**: Add/remove custom tags to organize content
- **Detail view**: Click any item to open a modal with full content, copy, delete, or edit tags
- **Archive**: Soft-delete items by archiving them

---

## Research

Navigate to `/app/research`.

1. Enter a research topic or question
2. AI generates a structured research report with sources and citations
3. Reports are saved to your library automatically

---

## Projects

Navigate to `/app/projects`.

- Create content projects (e.g., "My Finance Channel", "Tech Reviews")
- Each project has a title, description, and status
- Use projects to organize content in the Library
- Generate ideas specific to a project from the Studio

---

## Publish

Navigate to `/app/publish`.

- View your publishing queue
- Schedule content for future publishing
- Mark items as published
- Track publish status

---

## Keyboard Shortcuts

| Shortcut | Action | Where |
|----------|--------|-------|
| **Ctrl+G** | Generate content | Studio |
| **Ctrl+S** | Save to library | Studio (when content is shown) |
| **Ctrl+K** | Show keyboard shortcuts | Anywhere |
| **Ctrl+Shift+K** | Close keyboard shortcuts modal | Anywhere |

---

## AI Providers & Configuration

### Provider Priority (Auto-Select)

The system automatically picks the best available provider:

```
1. Ollama (if running locally — free)
2. DeepSeek (if DEEPSEEK_API_KEY set)
3. OpenAI (if OPENAI_API_KEY set)
```

You can force a provider by setting `LLM_PROVIDER=ollama` or `LLM_PROVIDER=deepseek` in `.env`.

### Ollama Setup (Free Local AI)

1. Ollama is already installed
2. Model `llama3.2` is already pulled
3. Set `OLLAMA_BASE_URL=http://localhost:11434` in `.env`
4. MINT will automatically use Ollama as the primary provider

### Circuit Breaker

Each AI provider has a circuit breaker:
- After 3 failures, the provider is "opened" (disabled)
- It recovers after 60 seconds of being closed
- If the fallback also fails, you get an error
- Check the Dashboard to see circuit breaker status

---

## Media Generation (Images, Voice, Video)

### Image Generation (ComfyUI)

- **Requires**: ComfyUI running locally with SD 1.5 model
- **How**: The backend API `/studio/generate-image` exists
- **Endpoint**: `POST /api/studio/generate-image` with `{ prompt: "your image prompt" }`
- **Output**: Image URL from ComfyUI
- **Setup**: `COMFYUI_BASE_URL=http://localhost:8188` in `.env`

### Voiceover (TTS)

- **Requires**: Piper TTS installed
- **How**: Generate a YouTube script → click "Generate Voiceover"
- **Output**: MP3 audio played in-browser
- **Voice**: Default is `en_US-amy-medium` (female)
- **Cost**: FREE (Piper TTS runs locally, offline)

### Video Generation (MoneyPrinterTurbo)

- **Requires**: MoneyPrinterTurbo running locally
- **How**: Generate a YouTube script → click "Generate Short Video"
- **What it does**: Auto-assembles stock footage, voiceover, subtitles, and background music
- **Output**: Video URL (streamed from MPT)
- **Setup**: `MONEY_PRINTER_BASE_URL=http://localhost:8501` in `.env`

---

## Data & Export

### Backup & Export

- **Export all data**: `GET /api/export` returns a JSON dump of all your content
- **Restore data**: `POST /api/restore` with the exported JSON
- **Export formats per item**: Markdown, JSON, .txt, .md

### Database

SQLite stores:
- Users (single user for personal use)
- Content projects
- Generated posts (with tags, favorites, status)
- Research reports
- Templates (saved prompt configurations)

---

## Troubleshooting

### "AI provider not available" error

- Check that Ollama is running: `ollama list`
- Start Ollama: `ollama serve`
- Check the Dashboard for circuit breaker status (might be "open" after failures)

### "ComfyUI not configured" error

- Set `COMFYUI_BASE_URL` in `.env` and start ComfyUI
- Or ignore — image generation is not exposed in the UI yet

### Database connection errors

- Ensure the backend can write to `backend/prisma/mint.db`
- Check `DATABASE_URL` in `backend/prisma/.env`

### Theme not persisting

- Theme is saved to `localStorage` as `mint-theme-preference`
- Also respects system `prefers-color-scheme: dark`

---

## Known Limitations

1. **No real email sending** in development — magic links are console-only
2. **Single user only** — no multi-user support, no role management
3. **Cost estimates are approximate** — token counts are `characterCount / 4`
4. **Image generation has no UI button** — API exists but no Studio button to trigger it from content
5. **No real publish integration** — Publish page is a queue/status tracker, not connected to YouTube/TikTok/Instagram APIs
6. **No content editor** — Generated content is read-only; you must copy and edit externally
7. **No batch operations** — Library items must be managed one by one
8. **No undo** — Delete and archive actions are immediate
9. **Voiceover is YouTube-script-only** — Other content types don't have a voiceover button
10. **Video generation requires MoneyPrinterTurbo** — A separate service, not bundled with MINT
11. **No offline mode** — AI generation requires internet (or local Ollama)
12. **Auth is dev-only** — No password login, no 2FA, no OAuth

---

## File Locations

| What | Where |
|------|-------|
| Source code | `frontend/src/` and `backend/src/` |
| Database schema | `backend/prisma/schema.prisma` |
| Database file | `backend/prisma/mint.db` |
| Environment config | `backend/.env` and `frontend/.env` |
| ComfyUI models | `D:\AgentDevWork\Programs\comfyui\ComfyUI\models\` |
| Piper TTS voices | `D:\AgentDevWork\Programs\piper-tts\voices\` |
| Ollama models | `C:\Users\AgentDev\.ollama\models\` |
| Drafts | `localStorage` in browser (auto-saved) |
| Theme preference | `localStorage` key `mint-theme-preference` |

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `start-mint.bat` | Start all services |
| `npm run dev` | Frontend only (Vite, :5173) |
| `npm run backend:dev` | Backend only (tsx, :4000) |
| `npm run dev:all` | Both backend + frontend |
| `npm run build` | Build frontend for production |
| `npm run backend:build` | Build backend for production |
| `npm run db:generate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run test` | Run test suite (Vitest) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format all files |

---

*MINT is a personal tool — built for one creator, not a SaaS. Use it, break it, improve it.*
