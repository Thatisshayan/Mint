# TODO — MINT Development Roadmap

## Priority Legend
🔥 = Current phase   ⏳ = Next   📅 = Planned

### Phase 1: Wire AI Services (✅ DONE)
- [x] Create AI provider abstraction (interface for DeepSeek/Ollama/OpenAI)
- [x] Wire DeepSeek/Ollama to Studio routes (text generation)
- [x] Wire ComfyUI to image generation route
- [ ] Add streaming AI responses (SSE)
- [x] Add prompt templates (script, hook, scenario, thumbnail)
- [x] Remove direct Ollama call from browser (route through backend)
- [ ] Add per-user rate limiting on AI endpoints

### Phase 2: Video Pipeline (✅ DONE)
- [x] Integrate MoneyPrinterTurbo as MINT service
- [x] Create video service abstraction (video.service.ts)
- [x] Integrate MPT as Docker sidecar + API client
- [x] Edge TTS service for voiceover (tts.service.ts)
- [x] Script → video pipeline (script → TTS → footage → MP4)
- [x] Video/TTS generation routes + Studio UI integration
- [x] Video preview & download in Studio
- [ ] Hook generator (AI script → 5 opening hooks)
- [ ] Scenario planner (outline → scene list)
- [ ] Long-form video support via Remotion

### Phase 3: Additional Integrations (⏳ NEXT)
- [ ] Coqui TTS for local voiceover alternative
- [ ] FFmpeg-based video assembly
- [ ] Stock footage via Pexels API
- [ ] Whisper for transcription
- [ ] Expanded AI providers (NVIDIA API fallback)

### Phase 4: Frontend Custom Design (📅 PLANNED)
- [ ] Process logo (remove background)
- [ ] Custom green theme (not default shadcn)
- [ ] Dashboard redesign with analytics
- [ ] Custom animations (Framer Motion)
- [ ] Responsive mobile layout
- [ ] Dark/light mode toggle

### Phase 5: Production (📅 PLANNED)
- [ ] Railway Docker deployment
- [ ] CI/CD with GitHub Actions
- [ ] Error tracking
- [ ] Usage analytics
- [ ] Tests (Vitest)

### Phase ∞: Polish
- [ ] Real SMTP email sending for auth
- [ ] YouTube Data API integration
- [ ] Instagram Graph API integration
- [ ] Content calendar
- [ ] Batch generation
- [ ] Export (MP4, MP3, SRT, TXT)

## Done ✅
- [x] Both PRs merged (kimi/security-backend + kilo/frontend-fixes)
- [x] @fastify/jwt registered (was missing — auth was broken)
- [x] Hardcoded auth tokens replaced with real JWT signing
- [x] Helmet registered (security headers)
- [x] AppLayout renders children instead of Outlet (pages were invisible)
- [x] Auth API paths fixed (frontend was calling wrong endpoints)
- [x] verifyMagicLink now includes email field (backend required it)
- [x] Projects create payload field name fixed (name → title)
- [x] useQueryClient() moved outside callback (React hooks violation)
- [x] ContentGenerator grid class restored (layout was broken)
- [x] OpenAI service: switched to chat/completions API + fresh AbortController per retry
- [x] ComfyUI service: added polling + proper history API
- [x] Railway PostgreSQL provisioned + Prisma migrated
- [x] All Prisma service-layer bugs fixed (field name mismatches)
- [x] Wire Projects/Library/Publish routes to Prisma services
