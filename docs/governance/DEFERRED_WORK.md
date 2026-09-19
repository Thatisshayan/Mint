# Deferred Work Register

Rule 12 / Rule 11. This register survives the session. Future agents resume from here.

## Format
- `[DATE] <scope>: <what> — <why deferred> — <resume hint> — <status>`

## Items
- [2026-09-19] local-dev-env: `npm install`/`npm ci` on this Windows dev machine
  intermittently produces truncated packages (e.g. `typescript` shipped with 8
  of ~113 `lib/*.d.ts` files, missing `node_modules/.bin` symlinks, `pathe`
  and `eslint-visitor-keys` package.json read errors) — matches the exact
  failures already recorded in `audits/2026-08-10_Alphonso_MINT_T0_Audit.md`,
  so this is a persistent, pre-existing local-environment issue, not
  something introduced by any single change. Root cause not confirmed but
  consistent with AV/OneDrive real-time scanning racing npm's file writes.
  — Deferred because it's a machine-level fix (AV exclusion for the repo
  path, or moving the working copy off a synced folder), not a repo-code
  fix. — Resume hint: if `npm run build`/`lint`/`test` fail with "cannot
  find module" errors that a second clean install doesn't fix, suspect this
  before assuming a code regression; verify file counts under
  `node_modules/typescript/lib/` (~113 expected) and `node_modules/.bin/`.
  — Status: open, workaround is retry-until-clean.
- [2026-09-19] third-party-checks: Codacy Static Code Analysis and `qlty
  check` report findings on PR #3 / main (Codacy: `action_required`; qlty:
  "4 blocking issues, including 1 vulnerability") that are outside this
  repo's own required `gate` check (R30) and need a maintainer with
  dashboard access to triage (app.codacy.com / qlty.sh). — Deferred because
  these tools' full finding detail isn't readable via the GitHub API/CLI
  used in this session. — Resume hint: open the linked dashboards from PR
  #3's check list. — Status: open.
- [2026-09-19] installer-secret-scan-gap: all three installer `.iss` scripts
  (`MINT_Setup.iss`, `MINT_Setup_Lite.iss`, `MINT_Setup_Personal.iss`) bundled
  `backend/.env` (and `MINT_Setup.iss`/`MINT_Setup_Lite.iss` also bundled root
  `.env`) directly into the compiled installer `.exe`. Discovered when
  building the v0.4.0 installer: this machine's `backend/.env` had a live
  `TAVILY_SEARCH_API_KEY` in it, which would have shipped inside the .exe and
  potentially into a public GitHub Release asset. Fixed by removing all
  `.env`/`backend\.env` `Source:` lines from all three `.iss` files — the app
  runs on safe built-in defaults with no `.env` present, `.env.example`
  templates still ship. — Deferred part: the repo's CI `secret-scan` (R30/R32)
  only scans committed files; it has no visibility into locally-built binary
  artifacts (the installer `.exe`), so this class of leak is structurally
  invisible to the existing gate. — Resume hint: consider a pre-release
  checklist item (or a `scripts/verify.sh` addition) that greps compiled
  installer output for common secret patterns before any release is cut, not
  just before commits. — Status: root cause fixed in this session; the
  detection gap itself is still open. **Also unresolved: whether any of the
  publicly-downloadable v0.3.0–v0.3.3 installer releases on GitHub shipped a
  real secret — not verifiable from git history since `.env` was always
  gitignored. Recommend rotating any API keys that were ever placed in
  `backend/.env` on a machine that built one of those releases, out of an
  abundance of caution.**
- [2026-09-19] npm-audit-findings: `npm audit` reports 18 vulnerabilities (1
  critical, 12 high, 4 moderate, 1 low) across the dependency tree, discovered
  while installing Remotion's deps for the captioned-video feature — these are
  **pre-existing**, not introduced by that install. Notable ones: `react-router`
  (high — open redirect, XSS, DoS advisories, affects `react-router-dom` too),
  `@fastify/static` (high — auth bypass / path traversal, `fixAvailable` but
  `isSemVerMajor: true`), `@prisma/config` (high, via `deepmerge-ts`), `postcss`
  / `postcss-selector-parser` (path traversal / DoS), `shell-quote` (DoS, via
  `concurrently`), `@vitest/mocker` (moderate — path traversal, `vitest`
  major-version fix available). — Deferred because most fixes are
  `isSemVerMajor: true` (breaking upgrades — e.g. `@fastify/static` 10→11,
  `vitest` 2→4) that need their own review/testing pass, not something to
  auto-apply via `npm audit fix --force` inside an unrelated feature's task.
  — Resume hint: run `npm audit` for the current full list; triage
  `react-router` first (it's a direct, actively-used dependency with multiple
  high-severity advisories, unlike the others which are mostly transitive).
  — Status: open, not yet triaged.
