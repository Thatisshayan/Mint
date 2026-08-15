# MINT T0 Verification — 2026-08-10 — Alphonso

## VERDICT: NOT GREEN

All 4 T0 gates FAIL. 0/4 pass.

| Command | Exit | Result |
|---|---|---|
| `npm run build` | 1 | FAIL |
| `npm run backend:build` | 1 | FAIL |
| `npm run test` | 1 | FAIL |
| `npm run lint` | 2 | FAIL |

## First error line per command

**1. `npm run build`** (tsc -b && vite build) — exit 1
```
frontend/src/components/layout/AppShell.tsx(2,55): error TS2460: Module '"framer-motion"' declares 'Easing' locally, but it is exported as 'MotionGlobalConfig'.
```

**2. `npm run backend:build`** (prisma generate && node backend/bundle.mjs) — exit 1
```
Unknown error during config file loading: Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\AgentDevWork\repos\.mint\MINT\node_modules\destr\dist\index.mjs' imported from D:\AgentDevWork\repos\.mint\MINT\node_modules\rc9\dist\index.mjs
```

**3. `npm run test`** (vitest run) — exit 1
```
Error: Cannot find package 'D:\AgentDevWork\repos\.mint\MINT\node_modules\@vitest\runner\node_modules\pathe\index.js' imported from D:\AgentDevWork\repos\.mint\MINT\node_modules\@vitest\runner\dist\chunk-tasks.js
```

**4. `npm run lint`** (eslint .) — exit 2
```
Error: Invalid package config \\?\D:\AgentDevWork\repos\.mint\MINT\node_modules\eslint-visitor-keys\package.json.
```

## Notes

- Failures 2, 3, 4 are **dependency-tree / node_modules integrity** failures (ERR_MODULE_NOT_FOUND on `destr`, `pathe`; corrupted `eslint-visitor-keys/package.json`), consistent with the known partially-broken bun reinstall. No project source was reached by these three gates.
- Failure 1 is the only gate that reached project source. tsc emitted 6 errors total; full list:
  - `frontend/src/components/layout/AppShell.tsx(2,55)` TS2460 framer-motion `Easing`
  - `frontend/src/components/ui/Button.tsx(2,40)` TS7016 no declaration for `class-variance-authority`
  - `frontend/src/lib/utils.ts(1,39)` TS7016 no declaration for `clsx`
  - `frontend/src/lib/utils.ts(2,25)` TS2307 cannot find module `tailwind-merge`
  - `frontend/src/pages/Dashboard.tsx(6,38)` TS2460 framer-motion `Easing`
  - `frontend/src/pages/Projects.tsx(3,55)` TS2460 framer-motion `Easing`
  - The TS7016/TS2307 errors are also dependency-shape issues (missing/mis-resolved type entrypoints), not necessarily authored-code defects.
- No installs, removals, or source edits were performed during this verification.
