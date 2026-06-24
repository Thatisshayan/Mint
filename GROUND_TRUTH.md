# GROUND_TRUTH — MINT Project

## Current State (June 2026)

Phase 1 complete — AI services wired to routes.

### What Works
- User authentication: Dev-only magic link with real JWT signing
- PostgreSQL database: Railway-hosted, Prisma-migrated
- API routes: All endpoints registered under `/api` prefix
- Frontend shell: Route guard, sidebar, header, error boundary
- Content Generator: Generates via backend API using AI provider abstraction
- AI provider abstraction: DeepSeek/Ollama/OpenAI interchangeable (configurable via LLM_PROVIDER)
- JWT auth middleware: Registered and working
- Rate limiting: Per-route (5 req/min for auth, 100/min for API)
- Error handling: Global error handler with Zod validation

### What's Partial
- Auth flow: Magic link is never emailed (dev-hardcoded)
- Frontend design: Custom green theme started, needs polish

### What's Missing
- Video generation (coming in Phase 2 with MoneyPrinterTurbo)
- TTS/voiceover (coming in Phase 2)
- Streaming AI responses (planned)
- Tests (zero — scaffold exists but no tests written)
- Security: Helmet registered, CSP disabled for API-only mode
- Logo: File exists (Mint.logo.jpg) — needs background removal

### Known Bugs
- None currently (all critical bugs from merge audit fixed)

### Railway Setup
- Project: MINT (Shayan Salimi workspace)
- PostgreSQL: Connected and migrated, public URL available
- Docker: Dockerfiles exist for frontend + backend + docker-compose
- Deployment: Not yet deployed
