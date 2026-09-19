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
