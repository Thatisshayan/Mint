# MINT — Builder First Message

---

## YOUR MISSION

You are the **Builder Agent** for the MINT project.

Your job is to execute the full sprint plan in `MintJuneComplitionSprint.md` from T001 to T146 — all 146 tasks across 5 phases — and push each phase to its own branch.

**The orchestrator will handle merging. You handle building.**

---

## RULES

1. **Take full ownership.** You are the lead. Create subagents as needed and coordinate them.
2. **Work in parallel.** Assign subagents to independent task groups simultaneously. Do not serialize work that can be parallelized.
3. **Each subagent gets a clear job.** Give each one a specific set of task numbers, the file paths they touch, and the validation method.
4. **Audit subagent output.** Compare their results. If two subagents touch the same file, reconcile conflicts before committing.
5. **After each phase:** assign a doc-update subagent to update `GROUND_TRUTH.md`, `KANBAN.md`, `TODO.md`, then commit and push to the phase branch.
6. **Stop only for:** destructive actions, secrets, paid services, production deploys, or irreversible changes. Everything else — keep going.
7. **No small questions.** Make the reasonable call and move forward. Token-saving mode ON.
8. **Make no mistakes.** There is no more time. Verify before committing.

---

## BRANCH STRATEGY

| Phase | Branch Name | Tasks |
|-------|-------------|-------|
| Phase 0 — Recovery | `phase0branch` | T001–T023 |
| Phase 1 — Tests | `phase1branch` | T024–T046 |
| Phase 2 — UX Polish | `phase2branch` | T047–T083 |
| Phase 3 — Reliability | `phase3branch` | T084–T118 |
| Phase 4 — Final Polish | `phase4branch` | T119–T146 |

Create each branch from the previous phase's branch (not from main). Push after every phase is complete and verified.

---

## PARALLELISM MAP

The following task groups are independent and can run in parallel within phases:

**Phase 0:** All recovery tasks are sequential (each fix enables the next).

**Phase 1:**
- Subagent A: Backend integration tests (T024–T032)
- Subagent B: Frontend component tests (T033–T038)
- Subagent C: E2E setup and tests (T039–T045)
- Run A + B + C in parallel. Wait for all three before running the full test suite.

**Phase 2:**
- Subagent A: Session binding fix (T047–T052)
- Subagent B: Component extraction (T053–T059)
- Subagent C: Scheduling feature (T060–T065)
- Subagent D: Soft-delete/undo (T066–T072)
- Subagent E: Template picker (T073–T077)
- Subagent F: PWA (T078–T082)
- Run A + B + C + D + E + F in parallel. Reconcile any shared file conflicts (ContentGenerator.tsx may be touched by A and B).

**Phase 3:**
- Subagent A: JWT + magic link (T084–T093)
- Subagent B: Input sanitization (T094–T099)
- Subagent C: Graceful shutdown + token counting (T100–T106)
- Subagent D: Image storage + versioning (T107–T117)
- Run A + B + C + D in parallel.

**Phase 4:**
- Subagent A: Performance (T119–T122)
- Subagent B: Framer Motion (T123–T126)
- Subagent C: Health check + scheduler (T127–T132)
- Subagent D: Final polish + docs (T133–T146)
- Run A + B + C + D in parallel.

---

## VALIDATION GATES

Before pushing any phase branch, ALL of the following must pass:

```bash
npm run lint       # 0 errors, 0 warnings
npm test           # all tests pass
npm run build      # 0 TypeScript errors
```

After Phase 1 and beyond, also run:
```bash
npm run e2e        # all E2E specs pass
```

If any gate fails, fix before committing.

---

## FILES TO READ FIRST

Before starting, read these files to understand current state:

1. `MintJuneComplitionSprint.md` — your full task list
2. `MINTAUDIT25.06.2026.md` — the audit report with all P0/P1 issues
3. `.kilo/plans/mint-to-100.md` — original plan with detailed step-by-step instructions for each task
4. `frontend/src/components/ContentGenerator.tsx` — currently broken, Phase 0 priority
5. `backend/prisma/schema.prisma` — current DB schema

---

## SKILLS TO USE

Assign these skills to subagents as relevant:
- `debugging-and-error-recovery` — for Phase 0 fix tasks
- `test-driven-development` — for Phase 1 test tasks
- `typescript-advanced-types` — for removing `any` types
- `performance` — for Phase 4 bundle optimization
- `ui-animation` — for Framer Motion transitions

---

## START

Begin with **Phase 0** immediately. Create the recovery subagent and start T001.

**Go.**

---

*From: Claude Orchestrator*
*To: Builder Agent*
*Date: 25.06.2026*
*Iteration: #1*
