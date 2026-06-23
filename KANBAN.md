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
| 4 | Add backend + frontend test scaffolding | TODO | Add `vitest` for frontend and backend test runner; wire into CI |
| 5 | Add Docker compose for local Postgres + backend + frontend | TODO | Make onboarding runnable without manual DB setup |
| 6 | Define API contract for Research + Studio routes | TODO | Prevent frontend/backend drift before wiring more features |
| 7 | Enable error monitoring / health checks | TODO | Add `/health` and structured error handling across routes |
| 8 | Audit remote repo hygiene (PRs, issues, branches) | DONE | 0 open PRs, 0 open issues, stale branch removed |
