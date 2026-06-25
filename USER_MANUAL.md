# MINT User Manual

> **MINT** — Personal AI Content Workstation for Faceless YouTube Channels
> Version: 0.6.0 (Sprint 6) | Last updated: 2025-01-21

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
15. [Mobile Usage](#mobile-usage)
16. [Troubleshooting](#troubleshooting)
17. [Known Limitations](#known-limitations)

---

## What MINT Does

MINT is a personal tool for creating faceless YouTube channel content. It helps you:

- **Generate AI content**: Scripts, hooks, captions, thumbnail prompts, and scenarios using DeepSeek, OpenAI, or Ollama (local)
- **Organize content**: Save, tag, favorite, and search generated content in a library
- **Create media**: Voiceover audio (Edge TTS), short videos (MoneyPrinterTurbo), and thumbnail images (ComfyUI)
- **Research topics**: AI-assisted research reports for content ideas
- **Manage projects**: Group content by project/channel
- **Track costs**: Monitor AI token usage and estimated costs
- **Publish**: Schedule and queue content for publishing

MINT is built for **personal use only** — single user, no multi-user support, no SaaS features.

---

## Prerequisites & Setup

### Required Software

- **Node.js** 18+ (for running the backend)
- **PostgreSQL** 14+ (database, or use Docker)
- **Docker & Docker Compose** (optional, recommended for easy setup)

### Optional External Services

| Service | Purpose | Required? |
|---------|---------|-----------|
| DeepSeek API | AI text generation (primary) | No — falls back to OpenAI or Ollama |
| OpenAI API | AI text generation (fallback) | No — falls back to Ollama |
| Ollama | Local AI text generation (free) | No — only if you want local AI |
| ComfyUI | AI image generation | No — only for thumbnail images |
| MoneyPrinterTurbo | AI video generation | No — only for auto-generated videos |

### Environment Variables

Create `backend/.env`:

```env
# Database (required)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mint?schema=public"

# JWT Secret (required for auth)
JWT_SECRET="your-random-secret-string-here-min-32-chars"

# AI Providers (at least one needed for generation)
DEEPSEEK_API_KEY="sk-your-deepseek-key"
# OPENAI_API_KEY="sk-your-openai-key"
# OLLAMA_BASE_URL="http://localhost:11434"

# LLM Provider preference (deepseek | openai | auto)
LLM_PROVIDER="deepseek"

# ComfyUI (optional, for image generation)
# COMFYUI_BASE_URL="http://localhost:8188"

# MoneyPrinterTurbo (optional, for video generation)
# MONEY_PRINTER_URL="http://localhost:8501"

# TTS (optional, uses Edge TTS by default)
# TTS_BASE_URL="https://api.edge-tts.com/v1/tts"
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:4000"
```

---

## How to Run

### Option 1: Docker (Recommended)

```bash
# Start everything (PostgreSQL + backend + frontend)
docker-compose up

# In another terminal, start the database migrations
npm run db:migrate
npm run db:seed
```

### Option 2: Manual (Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:migrate
npm run db:seed

# 3. Start both frontend and backend (in one terminal)
npm run dev:all

# Or start separately:
npm run backend:dev   # Backend: http://localhost:4000
npm run dev           # Frontend: http://localhost:5173
```

### Option 3: Production Build

```bash
# Build frontend
npm run build

# Build backend
npm run backend:build

# Start production server
npm run backend:start
```

The app will be available at `http://localhost:5173` (dev) or `http://localhost:4000` (production).

---

## Authentication

MINT uses **magic link authentication** for personal use. There is no real email sending configured in development.

### How to Sign In

1. Go to the login page
2. Enter your email address
3. Click "Send Magic Link"
4. The link is printed to the **backend console** (not sent to your email)
5. Copy the link from the console and paste it in your browser
6. You are now logged in

**Note**: In production, you would configure an SMTP service (SendGrid, Mailgun, etc.) in `backend/.env` with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

---

## Dashboard

The Dashboard (`/app/dashboard`) shows:

- **Quick stats**: Total content items, drafts, published, favorites
- **Recent activity**: Latest generated content
- **AI status**: Which provider is active (DeepSeek, OpenAI, or Ollama)
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

### For YouTube Scripts Only

When the generated content is a YouTube script, two extra buttons appear:

- **Generate Voiceover** — converts script to AI narration audio (Edge TTS)
- **Generate Short Video** — sends script to MoneyPrinterTurbo for auto-assembly

### Auto-Save Drafts

The Studio auto-saves your topic, type, and tone as a draft every 5 seconds. If you refresh the page, your inputs are restored. Drafts are cleared after successful generation.

---

## Library (Content Storage)

Navigate to `/app/library`.

### Features

- **Pagination**: 20 items per page (use Prev/Next buttons)
- **Filter by status**: All / Draft / Published / Archived
- **Favorites**: Toggle ★ to mark items as favorites
- **Search**: Full-text search across content, platform, and tags
- **Tags**: Add/remove custom tags to organize content
- **Detail view**: Click any item to open a modal with full content, copy, delete, or edit tags
- **Archive**: Soft-delete items by archiving them

### Keyboard Shortcuts in Library

None currently (the page is mouse-driven).

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
1. DeepSeek (if DEEPSEEK_API_KEY set)
2. OpenAI (if OPENAI_API_KEY set)
3. Ollama (if OLLAMA_BASE_URL set, or localhost:11434)
```

You can force a provider by setting `LLM_PROVIDER=deepseek` or `LLM_PROVIDER=openai` in `.env`. If you set it to `ollama`, it will always use Ollama.

### Ollama Setup (Free Local AI)

1. Install Ollama from https://ollama.com
2. Pull a model: `ollama pull llama3.1:8b`
3. Start Ollama: `ollama serve` (or let it run in background)
4. Set `OLLAMA_BASE_URL=http://localhost:11434` in `.env`
5. MINT will automatically use Ollama as the fallback

### Circuit Breaker

Each AI provider has a circuit breaker:
- After 3 failures, the provider is "opened" (disabled)
- It recovers after 60 seconds of being closed
- If the fallback also fails, you get an error
- Check the Dashboard to see circuit breaker status

### Content Moderation

All generated text is scanned for:
- Hate speech, threats, harassment
- Self-harm, sexual content
- Violence, illegal content

Flagged content is rejected with a 400 error and not logged to cost tracking.

---

## Media Generation (Images, Voice, Video)

### Voiceover (TTS)

- **Requires**: No external setup (uses Edge TTS by default)
- **How**: Generate a YouTube script → click "Generate Voiceover"
- **Output**: MP3 audio played in-browser
- **Voice**: Default is `en-US-JennyNeural` (female). You can configure via `voice` parameter in API.
- **Cost**: FREE (Edge TTS is a free Microsoft service)

### Video Generation (MoneyPrinterTurbo)

- **Requires**: MoneyPrinterTurbo running locally (Docker)
- **How**: Generate a YouTube script → click "Generate Short Video"
- **What it does**: Auto-assembles stock footage, voiceover, subtitles, and background music
- **Output**: Video URL (streamed from MPT)
- **Timeout**: 5 minutes max
- **Setup**: `MONEY_PRINTER_URL=http://localhost:8501` in `.env`

### Image Generation (ComfyUI)

- **Requires**: ComfyUI running locally with a Stable Diffusion workflow
- **How**: The backend API `/studio/generate-image` exists, but **there is no UI button in the Studio** to generate images from content yet. You can use the API directly or build a custom UI.
- **Endpoint**: `POST /api/studio/generate-image` with `{ prompt: "your image prompt" }`
- **Output**: Image URL from ComfyUI
- **Setup**: `COMFYUI_BASE_URL=http://localhost:8188` in `.env`
- **Note**: ComfyUI needs a workflow JSON. MINT uses a simple prompt-based workflow by default, or you can pass a custom `workflow` object.

---

## Data & Export

### Backup & Export

- **Export all data**: `GET /api/export` returns a JSON dump of all your content
- **Restore data**: `POST /api/restore` with the exported JSON
- **Export formats per item**: Markdown, JSON, .txt, .md

### Cost Tracking

All AI calls are tracked in `logs/ai_usage.jsonl`:

- Provider used (deepseek, openai, ollama)
- Model name
- Token count (estimated)
- Duration
- Success/failure status
- Content type (script, caption, etc.)
- Error messages (if any)

Cost estimates are approximate: ~1 token per 4 characters. Not accurate for non-English text.

### Database

PostgreSQL stores:
- Users (single user for personal use)
- Content projects
- Generated posts (with tags, favorites, status)
- Research reports
- Templates (saved prompt configurations)

---

## Mobile Usage

MINT is responsive and works on mobile:

- **Hamburger menu** (☰) on mobile opens the sidebar navigation
- **Overlay backdrop**: tap outside the sidebar to close it
- **Stacked layouts**: forms and grids stack vertically on small screens
- **Touch-friendly**: buttons are large enough for tap targets

---

## Troubleshooting

### "AI provider not available" error

- Check that `DEEPSEEK_API_KEY` or `OPENAI_API_KEY` is set in `.env`
- Or install Ollama and set `OLLAMA_BASE_URL`
- Check the Dashboard for circuit breaker status (might be "open" after failures)

### "ComfyUI not configured" error

- Set `COMFYUI_BASE_URL` in `.env` and start ComfyUI
- Or ignore — image generation is not exposed in the UI yet

### "Video generation timed out"

- MoneyPrinterTurbo may be slow. Check if the container is running.
- The video might still be processing — check the status endpoint.

### Database connection errors

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npm run db:migrate` to apply migrations

### Magic link not received

- In development, the magic link is printed to the **backend console** (not emailed)
- Check the terminal where `npm run backend:dev` is running

### Theme not persisting

- Fixed in Sprint 6 — theme is now saved to `localStorage` as `mint-theme-preference`
- Also respects system `prefers-color-scheme: dark`

---

## Known Limitations

1. **No real email sending** in development — magic links are console-only
2. **Single user only** — no multi-user support, no role management
3. **Cost estimates are approximate** — token counts are `characterCount / 4`, not accurate for non-English
4. **Image generation has no UI button** — API exists but no Studio button to trigger it from content
5. **No real publish integration** — Publish page is a queue/status tracker, not connected to YouTube/TikTok/Instagram APIs
6. **No content editor** — Generated content is read-only; you must copy and edit externally
7. **No batch operations** — Library items must be managed one by one
8. **No undo** — Delete and archive actions are immediate
9. **Voiceover is YouTube-script-only** — Other content types don't have a voiceover button
10. **Video generation requires MoneyPrinterTurbo** — A separate Docker service, not bundled with MINT
11. **No offline mode** — AI generation requires internet (or local Ollama)
12. **Auth is dev-only** — No password login, no 2FA, no OAuth

---

## File Locations

| What | Where |
|------|-------|
| Source code | `frontend/src/` and `backend/src/` |
| Database schema | `backend/prisma/schema.prisma` |
| Environment config | `backend/.env` and `frontend/.env` |
| AI logs | `logs/ai_usage.jsonl` |
| Cost stats | `logs/ai_usage.jsonl` (calculated on read) |
| Drafts | `localStorage` in browser (auto-saved) |
| Theme preference | `localStorage` key `mint-theme-preference` |

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev:all` | Start both backend + frontend (dev) |
| `npm run backend:dev` | Backend only (hot reload) |
| `npm run dev` | Frontend only (Vite) |
| `npm run build` | Build frontend for production |
| `npm run backend:build` | Build backend for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run test` | Run test suite (Vitest) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format all files |
| `docker-compose up` | Start full stack with Docker |

---

*MINT is a personal tool — built for one creator, not a SaaS. Use it, break it, improve it.*
