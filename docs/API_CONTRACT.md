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
| POST | `/api/research` | Yes | `{ projectId, query, sources?: string[] }` | `ResearchReport` | Enqueue research job |
| GET | `/api/research/:id` | Yes | — | `ResearchReport` | Poll status/result |
| GET | `/api/research` | Yes | `projectId?` | `ResearchReport[]` | List reports |

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

## Health

| Method | Path | Auth | Body | Success | Notes |
|--------|------|------|------|---------|-------|
| GET | `/api/health` | No | — | `{ status, uptime, db }` | Liveness |

## Contracts (request/response shapes)

- `Project`: `{ id, title, topic, tone, platform, createdAt, updatedAt }`
- `ResearchReport`: `{ id, projectId, status, sources, summary, createdAt }`
- `GeneratedPost`: `{ id, projectId, type, content, metadata, createdAt }`
