# GROUND_TRUTH — MINT Project

## Current State (June 2026)

Fully functional MVP — all 5 phases complete.

### What Works
- **User authentication**: Dev-only magic link with real JWT signing, refresh tokens, `/auth/me`
- **PostgreSQL database**: Railway-hosted, Prisma-migrated, all 4 models (User, ContentProject, GeneratedPost, ResearchReport)
- **API routes**: All endpoints registered under `/api` prefix — auth, projects, studio, research, library, publish
- **Frontend shell**: Route guard, sidebar, header, error boundary, responsive layout, dark/light mode
- **Content Generator**: Generates via backend API using AI provider abstraction — scripts, captions, thumbnails, hooks, scenarios
- **AI provider abstraction**: DeepSeek/Ollama/OpenAI interchangeable (configurable via LLM_PROVIDER env var)
- **JWT auth middleware**: Registered and working on all protected routes
- **Rate limiting**: Per-route (5 req/min for auth, 100/min for API)
- **Error handling**: Global error handler with Zod validation, AppError class
- **Image generation**: ComfyUI wired via `/studio/generate-image`
- **Video generation**: MoneyPrinterTurbo integrated as Docker sidecar (video.service.ts)
- **Voiceover generation**: Edge TTS service for audio (tts.service.ts)
- **Stock footage**: Pexels API integration via `/studio/search-stock`
- **Video assembly**: FFmpeg-based via `/studio/assemble-video`
- **Transcription**: Whisper service via `/studio/transcribe`
- **Custom green theme**: Mint CSS variables, custom components (mint-card, mint-btn), dark/light palette
- **Logo**: Processed mint-logo.png with transparency, favicon set
- **Railway deployment**: railway.json configured, Dockerfile for backend, healthcheck at `/health`
- **Docker**: Dockerfiles for frontend + backend + docker-compose with healthchecks

### What's Partial
- Auth flow: Magic link is never emailed (dev-hardcoded) — SMTP env vars configured but not wired
- Tests: Vitest configured but minimal tests written
- CI/CD: GitHub Actions workflow exists, needs final tweaks

### What's Missing
- Real SMTP email sending for production auth
- YouTube/Instagram Data API integrations
- Content calendar view
- Batch generation

### Known Bugs
- None currently (all critical bugs from merge audit fixed)

### Railway Setup
- Project: MINT (Shayan Salimi workspace)
- PostgreSQL: Connected and migrated, public URL available
- Docker: Dockerfiles exist for frontend + backend + docker-compose
- Deployment: railway.json configured, backend deployable via `railway up`
