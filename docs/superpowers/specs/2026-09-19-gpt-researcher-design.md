# GPT Researcher Integration — Design Spec

## Overview

Replace MINT's Research feature — currently an LLM asked to guess at "trends" with no
actual web search — with real, cited web research via
[GPT Researcher](https://github.com/assafelovic/gpt-researcher), run as a new local
service alongside Ollama/ComfyUI/Piper/Money Printer Turbo. This is item 1 of 4 planned
integrations from the AI-tools sheet review (AnimateDiff, SadTalker+OpenVoice, Remotion
follow later as separate specs).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Search retriever | DuckDuckGo | No API key — matches MINT's "no cloud keys needed for basic usage" philosophy (same reasoning as Ollama-first). |
| Run mode | Persistent local service, port `8002` | Matches the existing Ollama/ComfyUI/MPT pattern; enables live progress streaming; shows up on Settings page like the others. |
| LLM for synthesis | Reuse MINT's Ollama (`FAST_LLM`/`SMART_LLM` → same model as Settings' selected Ollama model) | No new model download, no cloud key, consistent with the rest of the app. |
| Fallback | Old LLM-guess behavior, tagged distinctly | Same shape as the existing AI-provider circuit breaker (Ollama→DeepSeek→OpenAI) — Research must never just break if the service isn't running. |
| Installation | Added to `MINT_Setup_Personal.iss` as an optional installer checkbox, `installer/download-gptresearcher.bat` helper | Matches Ollama/ComfyUI's "tick box, auto-download during setup" UX. |
| Report framing | Keep MINT's content-creator prompt (trends / competitor angles / content opportunities / audience insights) | Keeps the Research page's existing expectations; GPT Researcher supports a custom report type/prompt. |
| Citations | Stored and shown | `ResearchReport.citations` column already exists (unused today) — no migration needed. This is the actual point of doing real research. |
| Progress | Live WebSocket streaming | User opted for this over a v1 spinner; GPT Researcher's server natively supports it. |

## Architecture

```
Frontend (Research.tsx)
  │  WS: /research/stream            HTTP: GET /research, GET /research/:id
  ▼
Backend (Fastify)
  ├─ research.routes.ts
  │    ├─ WS /research/stream  → proxies to gptResearcher.service.ts
  │    └─ POST /research       → unchanged, now the fallback path
  ├─ services/ai/gptResearcher.service.ts (NEW)
  │    └─ WS client → local GPT Researcher server
  └─ services/research.service.ts
       └─ createResearch() gains `citations`, `source: 'gpt-researcher' | 'ai-fallback'`
  │
  ▼
GPT Researcher server (NEW local service, Python, port 8002)
  ├─ RETRIEVER=duckduckgo
  ├─ FAST_LLM=SMART_LLM=ollama:<MINT's selected model>
  └─ WebSocket: query in → { logs, report, sources } out
```

## Components

### GPT Researcher server (new local service)
- A thin FastAPI+WebSocket wrapper around the `gpt-researcher` pip package (the project
  ships one; MINT config just needs its own `.env`: `RETRIEVER=duckduckgo`,
  `FAST_LLM=ollama:<model>`, `SMART_LLM=ollama:<model>`, `OLLAMA_BASE_URL`).
- Runs on `:8002`. Not bundled into the Node backend process — a separate Python
  process, like ComfyUI/Piper/MPT.
- `installer/download-gptresearcher.bat` (new, mirrors `download-ollama.bat`): installs
  Python deps via pip if needed, writes the `.env`, and can start the service.
- `installer/MINT_Setup_Personal.iss`: new `[Tasks]` entry `installgptresearcher`
  alongside `installollama`/`installcomfyui`.
- Manual dev-mode setup: documented in README (`pip install gpt-researcher`, `.env`,
  `uvicorn` start command) — same tier as Money Printer Turbo's docs today.

### `backend/src/services/ai/gptResearcher.service.ts` (new)
- `runResearch(query, { onProgress }): Promise<{ report: string; sources: {title, url}[] }>`
- Opens a WS to `ws://localhost:8002` (configurable via `GPT_RESEARCHER_BASE_URL`),
  sends `{ query, report_type: "custom_report", report_source: "web", tone: <content-creator framing prompt> }`.
- Re-emits `logs` events via the `onProgress` callback (used by the route to forward to
  the frontend), resolves with the final `report` + `sources` on completion, rejects on
  connection failure or a server-side error event.
- Connection failure (ECONNREFUSED / timeout) is the fallback trigger — caller decides
  what to do with that, this service doesn't fall back itself.

### `backend/src/routes/research.routes.ts` (modified)
- New `fastify.get('/research/stream', { websocket: true }, ...)` (requires adding
  `@fastify/websocket` as a new backend dependency, registered in
  `backend/src/index.ts` alongside the other `@fastify/*` plugins).
- On connection: auth check before proceeding. This is MINT's first WebSocket route —
  there's no existing precedent to match, so: verify the JWT passed as a
  `?token=` query param (WS handshakes can't carry an Authorization header from the
  browser) using the same `jwt.verify()` call `authMiddleware` uses; reject the
  connection (close with an auth error code) if missing/invalid. Dev mode keeps its
  existing auto-verify-dummy-token behavior. Then call `gptResearcher.service.ts`'s
  `runResearch()`.
  - Try the real service first. On connection failure, immediately fall back to the
    existing `researchPrompt()` LLM-guess path and stream a single "using fallback"
    progress event so the frontend can show that distinction, then the final report.
  - On success: call `createResearch()` with `summary`, `citations` (JSON-stringified
    array), `source: 'gpt-researcher'` (or `'ai-fallback'` for the degraded path), then
    send a final `{ type: 'done', report }` message and close.
- Existing `POST /research` route stays unchanged, byte-for-byte — it's now also the
  fallback implementation, just reused as-is.

### `backend/src/services/research.service.ts` (modified)
- `createResearch()`: input schema gains optional `citations: string` (JSON array of
  `{title, url}`) and `source` already exists as a required field — no schema change,
  just start populating `citations` meaningfully instead of leaving it `undefined`.

### `backend/src/routes/settings.routes.ts` (modified)
- `gatherStatuses()` gains a fifth entry, following the exact `if (comfy) { out.push(...) }` pattern ComfyUI/MPT already use: only pushed into the `services` array when `GPT_RESEARCHER_BASE_URL` is set in `.env`, defaulting to `http://localhost:8002` — `{ name: 'gpt-researcher', url: gptResearcherUrl, reachable: await ping(gptResearcherUrl), detail: 'Real web research for the Research page.' }`.

### `frontend/src/pages/Research.tsx` (rebuilt)
Currently a bare form with no report display at all (`useResearch()` exists in the
store but isn't called from this page today). This needs:
- The existing `useResearch(projectId)` query wired up and rendered as a list of past
  reports (query text, source badge, timestamp, truncated summary).
- A new `useResearchStream()` hook (`frontend/src/hooks/useResearchStream.ts`, new
  file): opens the `/research/stream` WebSocket on submit, exposes
  `{ status: 'idle'|'connecting'|'researching'|'done'|'error', logs: string[], result }`,
  handles reconnect-once-on-drop, closes cleanly on unmount.
- A progress panel shown while `status === 'researching'`: scrolling log lines from
  `logs`.
- Each report, once done, renders its `summary` plus a citations list (linked source
  titles/URLs) below it, and a small badge distinguishing `gpt-researcher` (real
  search) from `ai-fallback` (LLM guess) results.

## Error Handling

- **GPT Researcher unreachable at request start** → immediate fallback to
  `researchPrompt()` LLM-guess path (existing behavior), tagged `source: 'ai-fallback'`
  so the UI can visibly flag it as not-real-research.
- **WS drops mid-research** (after connecting, before completion) → send an `error`
  message to the frontend, close the connection, do **not** persist a partial
  `ResearchReport` row. The frontend shows an inline error with a retry button; no
  silent fallback mid-stream (that would risk mixing partial real search with a guess
  in one report).
- **Frontend WS drop** (browser tab backgrounded, network blip) → one automatic
  reconnect attempt; if that also fails, show the same inline error state.

## Testing

- **Backend unit**: mock `gptResearcher.service.ts`'s WS client —
  1. connection-refused → fallback path fires, report tagged `ai-fallback`.
  2. successful run → report tagged `gpt-researcher`, `citations` persisted as valid
     JSON matching the sources GPT Researcher returned.
  3. mid-stream error → no `ResearchReport` row created, error propagated to caller.
- **Manual** (with the GPT Researcher service actually running locally):
  1. Submit a real query → verify a report appears with clickable, correct-looking
     sources and the `gpt-researcher` badge.
  2. Stop the service, submit again → verify graceful fallback with the `ai-fallback`
     badge, no crash.
  3. Settings page → verify the new reachability row reflects the service's actual
     state.
  4. Kill the service mid-research → verify the frontend shows the error state, no
     ghost/partial report saved.

## Out of Scope (this spec)

- AnimateDiff, SadTalker/OpenVoice, Remotion — separate specs, per the agreed order.
- Changing GPT Researcher's report depth/mode beyond the standard single-pass report
  (no "deep research" multi-agent mode in v1).
- Per-project research scoping UI changes beyond what already exists
  (`projectId` plumbing is already in the store/schema, untouched here).
