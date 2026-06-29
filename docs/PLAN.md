# MINT Delivery Plan

Goal: make MINT a working personal product for faceless YouTube / Instagram content, using zero-cost local AI services.

## Zero-Cost Stack
- Backend: Fastify 5 + Prisma 6 + SQLite
- Frontend: React 18 + Vite 6 + Tailwind CSS 3
- Brain: Ollama local models (llama3.2, 2GB VRAM)
- Images: ComfyUI with SD 1.5 model (local, GPU-accelerated)
- Voice: Piper TTS (local, offline)
- Video: MoneyPrinterTurbo (optional, separate install)
- Export: markdown / JSON bundles

## Current State (as of June 2026)
- All core features working
- Local AI services installed and configured
- Backend starts on port 4000
- Frontend starts on port 5173
- Documentation updated

## What's Done
- [x] Backend Fastify 5 with all routes
- [x] Frontend React 18 with all pages
- [x] SQLite database with Prisma 6
- [x] Ollama integration (primary LLM)
- [x] ComfyUI integration (image generation)
- [x] Piper TTS integration (voiceover)
- [x] MoneyPrinterTurbo integration (video generation)
- [x] Auth (dev auto-verify)
- [x] Dark/light mode
- [x] Keyboard shortcuts
- [x] Error handling
- [x] Rate limiting
- [x] start-mint.bat launcher

## What's Not Started
- [ ] Real SMTP email sending for auth
- [ ] YouTube Data API integration
- [ ] Instagram Graph API integration
- [ ] Content calendar
- [ ] Batch generation
- [ ] Brave Search API for web research
- [ ] Money Printer Turbo setup

## Next Session Tasks
1. Test all features end-to-end
2. Fix any remaining bugs
3. Add more keyboard shortcuts
4. Improve error messages
5. Add more content types
