# MINT Delivery Plan

Goal: make MINT a working personal product for faceless YouTube / Instagram content, using zero-cost backend + local generation.

## Zero-Cost Stack
- Backend: Fastify + Prisma + SQLite
- Frontend: React + Vite + Tailwind
- Brain: Ollama local models
- Media placeholder: ComfyUI hook (optional)
- Export: markdown / JSON bundles

## Current State (as of latest cleanup)
- Remote repo hygiene done: stale Snyk PR closed, branch deleted
- Backend routes fixed for ESM: all route files now export default plugins
- Auth stubs added matching API contract (magic-link, verify, refresh, logout, me)
- `/health` route + structured error handler implemented
- API contract documented in `docs/API_CONTRACT.md`
- Docker compose + Dockerfiles added for backend, frontend, postgres
- Vitest config scaffold added for frontend test coverage

## Backend Plan
- Keep API routes under `/api`
- Auth: dev stubs only (magic-link placeholder, JWT placeholder)
- Storage: SQLite by default
- Generation: Ollama hook (stub ready)
- Research: Brave Search integration pending

## Frontend Plan
- Studio page: topic in -> script / caption / thumbnail prompt out
- Projects page: real list + create flow
- Library page: saved drafts
- Publish page: download / copy exports

## Next Session Tasks
1. Add frontend + backend test runner and sample tests
2. Wire Ollama generation route (replace studio stub)
3. Add Brave Search research route (replace research stub)
4. Add seed data + Prisma migration verification
5. Polish UI flows (Projects, Studio, Publish)
