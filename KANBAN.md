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
| 3 | Add backend + frontend test scaffolding | TODO | Add `vitest` for frontend and `jest`/`pytest` equivalent for backend; wire into CI |
| 4 | Add Docker compose for local Postgres + backend + frontend | TODO | Make onboarding runnable without manual DB setup |
| 5 | Define API contract for Research + Studio routes | TODO | Prevent frontend/backend drift before wiring more features |
