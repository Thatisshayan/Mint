# MINT — MINT Kanban

## Columns
- [ ] TODO
- [ ] IN PROGRESS
- [ ] DONE

## Board
| ID | Item | Column | Notes |
| --- | --- | --- | --- |
| 1 | Add CI/CD workflow | DONE | `.github/workflows/ci.yml`; runs `lint`, `build`, `format --check` on push/PR |
| 2 | Create in-repo task board | DONE | `KANBAN.md` added |
| 3 | Close stale Snyk PR #1 & delete remote branch | DONE | PR was based on old v6 baseline, removed backend files, not mergeable against main |
| 4 | Add backend + frontend test scaffolding | DONE | `vitest` + `jsdom` + `@testing-library/react` added to devDeps; `test` script added |
| 5 | Add Docker compose for local Postgres + backend + frontend | DONE | `docker-compose.yml` exists; `backend/Dockerfile` path fixed; frontend build stage added |
| 6 | Define API contract for Research + Studio routes | DONE | `docs/API_CONTRACT.md` exists; `frontend/src/stores/research.ts` double `/api` bug fixed |
| 7 | Enable error monitoring / health checks | DONE | `/health` endpoint active; `fetchWrapper.ts` now throws on HTTP errors; token expiry validated |
| 8 | Audit remote repo hygiene (PRs, issues, branches) | DONE | 0 open PRs, 0 open issues, stale branch removed |
| 9 | Fix duplicate route registration | DONE | `backend/src/index.ts` lines 108-112 removed |
| 10 | Fix ESM `require('fs')` | DONE | `assembly.service.ts` and `whisper.service.ts` use `fs/promises` |
| 11 | Add missing `react-hook-form` | DONE | Added to `package.json` dependencies |
| 12 | Remove dead code | DONE | `AppHome.tsx`, `Loader.tsx` deleted |
| 13 | Fix Input.tsx `cn()` duplication | DONE | Now imports from `@/lib/utils` |
| 14 | Fix `tsconfig.app.json` paths | DONE | `@/*` maps to `./frontend/src/*` |
| 15 | Add token expiry validation | DONE | `useSession.ts` clears expired tokens |
| 16 | Connect DB explicitly | DONE | `connectDb()` called before `app.listen()` |
| 17 | Add CRUD endpoints (GET/:id, PATCH, DELETE) | DONE | All resources: projects, research, library, publish |
| 18 | Build Library page | DONE | Full page with list, filter, detail modal, delete, archive |
| 19 | Build Publish page | DONE | Full page with queue, publish, copy, remove |
| 20 | Wire Research to router + sidebar | DONE | `App.tsx` has route; `AppShell.tsx` has sidebar link |
| 21 | Rewrite stores/library.ts as TanStack Query | DONE | useLibrary, useLibraryItem, useDelete, useUpdate, useSaveToLibrary |
| 22 | Rewrite stores/publish.ts as TanStack Query | DONE | usePublishQueue, usePublishItem, useDeletePublishItem |
| 23 | Sprint 1b: Wire AI studio stubs to real providers | DONE | `generateIdeas` uses AI provider; `generateImage` uses ComfyUI; AI status indicator added |
| 24 | Sprint 2: AI quality + daily use polish | DONE | Prompt A/B testing, cost tracking, content moderation, keyboard shortcuts, export formats, toast notifications |
| 25 | Sprint 3: Reliability + DevEx | DONE | Structured logging, circuit breaker, offline indicator, tests, one-command startup, documentation |
| 26 | Sprint 4: Personal workflow features | DONE | Tags, search, favorites, templates, dashboard, auto-save drafts |
| 27 | Sprint 5: Final polish | DONE | Performance (lazy loading), animations (Framer Motion), data export, README |
| 28 | Install local AI services | DONE | ComfyUI, Piper TTS, configure Ollama, create start-mint.bat |
| 29 | Update documentation | DONE | README, ARCHITECTURE, AGENTS, GETTING_STARTED, AI_PROVIDERS, GROUND_TRUTH, TODO |
