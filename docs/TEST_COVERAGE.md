> **⚠️ Stale scaffold.** Says "NOT_STARTED" for everything, but tests exist and pass:
> `backend/src/lib/circuitBreaker.test.ts`, `backend/src/services/research.service.test.ts`,
> `backend/src/services/ai/gptResearcher.service.test.ts`,
> `frontend/src/hooks/useResearchStream.test.ts`, `frontend/src/lib/utils.test.ts`, and
> more — this table was never updated after being created. Run `npm test` for current
> results; there's no maintained coverage-percentage tracker.

# MINT Test Coverage Plan

## Test Suite Map

| Test Type | File Path | Coverage Goal | Status |
|-----------|-----------|---------------|--------|
| Backend Services | backend/tests/service.test.js | 100% | NOT_STARTED |
| Frontend Components | frontend/tests/components/.* | 85% | NOT_STARTED |
| API Routes | backend/tests/route.test.js | 90% | NOT_STARTED |

## Update Policy
- Add test coverage metrics after each task completion
- Use jest-coverage to generate reports
- Update documentation weekly during active development

## Verification Steps
1. Run `npm run test:coverage` after implementation
2. Compare JSON output with prior coverage data
3. Merge coverage results to main branch