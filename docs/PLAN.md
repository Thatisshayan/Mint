# MINT Delivery Plan

Goal: make MINT a working personal product for faceless YouTube / Instagram content, using zero-cost backend + local generation.

## Zero-Cost Stack
- Backend: Fastify + Prisma + SQLite
- Frontend: React + Vite + Tailwind
- Brain: Ollama local models
- Media placeholder: ComfyUI hook (optional)
- Export: markdown / JSON bundles

## Backend Plan
- Keep API routes under `/api`
- Auth: dev email+password or magic code unless SMTP is added
- Storage: SQLite by default
- Generation: Ollama first, ComfyUI later when local GPU is available

## Frontend Plan
- Studio page: topic in -> script / caption / thumbnail prompt out
- Projects page: real list + create flow
- Library page: saved drafts
- Publish page: download / copy exports

## Deployment Plan
- Build frontend to dist
- Start backend with `node dist/index.js` or `npm run backend:start`
- One-command run with `concurrently` for personal use

## Next Session Tasks
1. Replace fake auth with working local auth
2. Run Prisma migration for current schema
3. Add Ollama generation route
4. Build real LL + publish output flow
