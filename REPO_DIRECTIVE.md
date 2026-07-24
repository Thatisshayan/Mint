# MINT — REPO_DIRECTIVE

> Goal-layer constitution. `REPO_RULES.md` is the law; this is the mission. Every task
> MUST carry `traces-to:`. Orphan tasks rejected by CI (scripts/verify.sh → directive-lint) + Sentinel.

## Vision

MINT is a unified multi-provider LLM abstraction + AI app platform: Fastify 5 + Prisma 6
+ React 19 + Vite, running local-first with Ollama. North-star: one clean interface to
every model provider, local-first by default, no hardcoded secrets, drop-in apps.

## Non-Goals

- NOT a model-training platform; inference/orchestration only.
- NOT adding providers without the multi-provider abstraction layer.
- NOT cloud-only; local-first (Ollama) must always work.
- NOT storing keys in repo; .env + .gitignore from first commit.

## Phases

### P1 — Core Abstraction (CURRENT)
  exit criteria: Fastify+Prisma boot; provider abstraction live; tsc clean.
### P2 — App Surface
  exit criteria: React 19 UI usable for chat/agent flows.
### P3 — Local-First Ollama
  exit criteria: Ollama path parity with cloud providers.

## Sprints

### S1 (maps to P1) — stabilize backend
  goal: Fastify routes + Prisma client reliable.
### S2 (maps to P2) — UI
  goal: web app talks to backend only via typed API.

## Epics / Chapters

### E1 — Provider Abstraction (maps to P1)
  uniform interface across models; no provider-specific leaks.
### E2 — Data (maps to P1)
  Prisma schema migration-safe.
### E3 — UI (maps to P2)
  React 19 + Vite app.

## Tasks

- [ ] T1 — Document the provider abstraction contract (interface + adapters) | traces-to: P1/S1/E1 | acceptance: every adapter implements the contract; doc matches code
- [ ] T2 — Add Prisma migration check to CI (generate vs db diff) | traces-to: P1/S1/E2 | acceptance: drift blocked before merge
- [ ] T3 — Wire React 19 UI to backend via typed client only | traces-to: P2/S2/E3 | acceptance: no direct fetch to providers from UI
- [ ] T4 — Verify Ollama local path returns same shape as cloud provider | traces-to: P3/S1/E1 | acceptance: adapter output identical for local+cloud
- [ ] T5 — Ensure .env.example covers all providers, no real keys committed | traces-to: P1/S1/E1 | acceptance: secret-scan clean; example complete

## Sentinel Constraints

- auto-approve: docs/tests/typing tracing to P1/E1.
- review-required: provider adapters, Prisma schema, auth, secrets handling.
- locked: `main`; `prisma/schema.prisma` migrations need Shayan; secrets never.
