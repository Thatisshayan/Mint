# GROUND_TRUTH — MINT Project

## Current State (June 2026)

### What Works
- User authentication: Dev-only magic link with real JWT signing
- PostgreSQL database: Railway-hosted, Prisma-migrated
- API routes: All endpoints registered under `/api` prefix
- Frontend shell: Route guard, sidebar, header, error boundary
- Content Generator: Direct Ollama call from browser (bypasses backend API)
- JWT auth middleware: Registered and working
- Rate limiting: Per-route (5 req/min for auth, 100/min for API)
- Error handling: Global error handler with Zod validation

### What's Partial
- AI services (OpenAI, ComfyUI, Ollama): implementations exist but not wired to routes
- All backend API endpoints return stub/placeholder data
- Auth flow: Magic link is never emailed (dev-hardcoded)
- Frontend design: Custom green theme started, needs polish

### What's Missing
- AI services wired to route handlers (Phase 1)
- Image generation (ComfyUI service exists, not connected)
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
