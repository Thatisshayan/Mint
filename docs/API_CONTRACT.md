# MINT API Contract

## Base

- Backend base URL: `/api`
- Auth: Bearer JWT via `@fastify/jwt`
- Content-Type: `application/json`
- Errors: `{ code, message, details? }`

## Auth

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| POST | `/api/auth/magic-link` | No | `{ email }` | `{ sent: true }` | Dev-only; no real SMTP |
| POST | `/api/auth/verify` | No | `{ token, email }` | `{ accessToken, refreshToken, user }` | JWT issued here |
| POST | `/api/auth/refresh` | No | `{ refreshToken }` | `{ accessToken }` | Rotate access token |
| POST | `/api/auth/logout` | Yes | — | `{ ok: true }` | Invalidate session |
| GET | `/api/auth/me` | Yes | — | `{ user }` | Current user |

## Projects

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| GET | `/api/projects` | Yes | — | `Project[]` | List user projects |
| POST | `/api/projects` | Yes | `{ title, topic, tone, platform }` | `Project` | Create project |
| GET | `/api/projects/:id` | Yes | — | `Project` | |
| PATCH | `/api/projects/:id` | Yes | partial `Project` | `Project` | |
| DELETE | `/api/projects/:id` | Yes | — | `{ ok: true }` | |

## Research

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| POST | `/api/research` | Yes | `{ query, source? }` | `{ id, query, source, summary, createdAt }` | LLM-guess research (no real search) — this is also GPT Researcher's fallback path internally |
| GET | `/api/research/:id` | Yes | — | `ResearchReport` | Poll status/result |
| GET | `/api/research` | Yes | `projectId?` | `{ reports: ResearchReport[] }` | List reports (fires for all reports when `projectId` omitted) |
| DELETE | `/api/research/:id` | Yes | — | `{ success: true }` | |
| GET (WS) | `/api/research/stream?token=<jwt>` | Yes (query param, not header — WS can't carry Authorization) | client sends `{ query }` after connect | server sends `{type:'progress',message}` events, then `{type:'done',report,sources,id}` or `{type:'error',message}` | Real web research via GPT Researcher (falls back to the `POST /research` LLM-guess path on any failure) |

`ResearchReport`: `{ id, query, source: 'ai' \| 'gpt-researcher' \| 'ai-fallback', summary, citations?: string (JSON array of {title,url}), createdAt, updatedAt }`

## Studio

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| POST | `/api/studio/generate` | Yes | `{ projectId, type: "script"|"caption"|"thumbnail", prompt? }` | `GeneratedPost` | Generate from project context |
| POST | `/api/studio/regenerate` | Yes | `{ generatedPostId, feedback? }` | `GeneratedPost` | Iterate on existing output |
| GET | `/api/studio/:id` | Yes | — | `GeneratedPost` | |

## Library

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| GET | `/api/library` | Yes | — | `GeneratedPost[]` | Saved drafts |
| POST | `/api/library/:id/save` | Yes | — | `{ ok: true }` | |
| DELETE | `/api/library/:id` | Yes | — | `{ ok: true }` | |

## Publish

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| POST | `/api/publish/export` | Yes | `{ generatedPostId, format: "md"|"json" }` | `{ url, filename }` | Download bundle |
| POST | `/api/publish/copy` | Yes | `{ generatedPostId }` | `{ copied: true }` | Clipboard export |

## Templates

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| GET | `/api/templates` | Yes | — | `Template[]` | |
| POST | `/api/templates` | Yes | `Template` fields | `Template` | |
| GET | `/api/templates/:id` | Yes | — | `Template` | |
| DELETE | `/api/templates/:id` | Yes | — | `{ success: true }` | |

## Files

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/files` | Yes | Listing grouped by subdir under the unified output folder |
| GET | `/api/files/:subdir/:name` | Yes | Download a single file (sanitized name, root-prefix guard) |
| GET | `/api/files/_config` | Yes | The resolved output root path |

## Settings

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/settings/services` | Yes | Local-service reachability (Ollama, ComfyUI, Piper, Money Printer, GPT Researcher if configured) + installed Ollama models |
| POST | `/api/settings/ollama-model` | Yes | Set the user's preferred Ollama model |
| POST | `/api/settings/run-migrations` | Yes | Self-test: connect + count rows on every table |

## Health

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| GET | `/api/health` | No | — | `{ status, uptime, db }` | Liveness |

## Contracts (request/response shapes)

- `Project`: `{ id, title, topic, tone, platform, createdAt, updatedAt }`
- `ResearchReport`: `{ id, projectId, status, sources, summary, createdAt }`
- `GeneratedPost`: `{ id, projectId, type, content, metadata, createdAt }`
