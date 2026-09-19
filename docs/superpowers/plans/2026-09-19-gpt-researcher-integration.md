# GPT Researcher Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MINT's Research feature (currently an LLM guessing at trends, no real
search) with real, cited web research via a local GPT Researcher service, with live
progress streaming and a graceful fallback to today's behavior when the service isn't
running.

**Architecture:** A new local Python service (GPT Researcher's own FastAPI+WebSocket
server, port 8002) does the actual searching (DuckDuckGo retriever) and synthesis
(MINT's existing Ollama). MINT's Fastify backend gets a new WebSocket route
(`/research/stream`, via `@fastify/websocket`) that proxies to it, with the existing
LLM-guess `POST /research` route kept as a fallback. The frontend gets a WebSocket hook
and a rebuilt Research page (it currently doesn't even display past reports).

**Tech Stack:** Fastify 5, `@fastify/websocket` (new dependency), Prisma 6/SQLite,
React 18, TanStack Query, native browser `WebSocket`. External: GPT Researcher (Python,
`pip install gpt-researcher`), DuckDuckGo retriever (no key), Ollama (existing).

**Spec:** `docs/superpowers/specs/2026-09-19-gpt-researcher-design.md`

---

## Task 0: Spike — verify GPT Researcher's real WebSocket protocol

This resolves the one thing in the spec that's confirmed-but-incomplete: we know the
client sends `"start " + JSON.stringify({task, report_type, report_source, tone, ...})`
and the server sends `{"type": "logs", ...}` progress messages and a final
`{"type": "path", "output": {"pdf", "docx", "md", "json"}}` message with file paths —
but we don't yet know whether the server also streams the report markdown/sources
inline, or whether those only exist in the output files at those paths, and whether
those paths are fetchable over HTTP from the running server. Task 3 depends on knowing
this for real, not guessing.

**Files:**
- Create: `docs/superpowers/specs/2026-09-19-gpt-researcher-spike-notes.md` (spike
  findings, committed for the record)
- Create (scratch, not committed): a throwaway Python venv under
  `D:\Temp\claude\gptr-spike\` — do not put this inside the MINT repo

- [ ] **Step 1: Set up a throwaway GPT Researcher server**

```bash
mkdir -p D:/Temp/claude/gptr-spike && cd D:/Temp/claude/gptr-spike
python -m venv venv
# Windows Git Bash:
source venv/Scripts/activate
pip install gpt-researcher fastapi uvicorn python-dotenv websockets
```

Create `D:/Temp/claude/gptr-spike/.env`:
```env
RETRIEVER=duckduckgo
FAST_LLM=ollama:llama3.2
SMART_LLM=ollama:llama3.2
OLLAMA_BASE_URL=http://localhost:11434
```

(Requires Ollama already running locally with `llama3.2` pulled — this repo's
`GROUND_TRUTH.md` confirms that model is already the verified-working one on this
machine.)

- [ ] **Step 2: Get GPT Researcher's own server running**

Clone just the server piece (don't vendor this into MINT — it's throwaway):
```bash
cd D:/Temp/claude/gptr-spike
git clone --depth 1 https://github.com/assafelovic/gpt-researcher.git src
cd src
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8002
```

Expected: server starts, logs `Uvicorn running on http://127.0.0.1:8002`.

- [ ] **Step 3: Write a minimal test client and capture the real message log**

Create `D:/Temp/claude/gptr-spike/test_client.py`:

```python
import asyncio
import json
import websockets

async def main():
    async with websockets.connect("ws://localhost:8002/ws") as ws:
        payload = {
            "task": "content marketing trends for faceless YouTube channels 2026",
            "report_type": "research_report",
            "report_source": "web",
            "tone": "Analytical",
            "source_urls": [],
            "document_urls": [],
        }
        await ws.send("start " + json.dumps(payload))

        log = []
        async for raw in ws:
            log.append(raw)
            print(raw[:200])
            data = json.loads(raw)
            if data.get("type") == "path":
                break

        with open("message_log.jsonl", "w", encoding="utf-8") as f:
            f.write("\n".join(log))

asyncio.run(main())
```

Run: `python test_client.py`

Expected: the script runs for roughly 30-90 seconds (real web research), then exits
after receiving the `"type": "path"` message. `message_log.jsonl` now contains every
raw message the server actually sent, in order.

- [ ] **Step 4: Inspect the captured log and the output files**

```bash
cat D:/Temp/claude/gptr-spike/message_log.jsonl | grep -o '"type":"[^"]*"' | sort -u
cat D:/Temp/claude/gptr-spike/src/outputs/*.json 2>&1 | head -100
```

Answer these two questions concretely (write the answers into the spike notes file in
Step 5):
1. Does any message in the log have `"type": "report"` (or similar) with inline
   markdown content, or is the full report only ever available via the file at the
   `"md"` path from the final `"path"` message?
2. Is the file at the `"json"` path (e.g. `outputs/<id>.json`) fetchable over plain
   HTTP from the running server (e.g. `curl http://localhost:8002/outputs/<id>.json`),
   or does `main.py`'s FastAPI app not mount `outputs/` as static files at all (in
   which case Task 3's service needs to read the file from local disk directly, which
   only works because MINT and GPT Researcher run on the same machine — note this as a
   constraint)?

- [ ] **Step 5: Write spike-notes.md and commit**

Write `docs/superpowers/specs/2026-09-19-gpt-researcher-spike-notes.md` containing: the
exact answers to both questions above, a representative excerpt of the captured
message log (a handful of real lines, redacted of nothing since it's just public
research content), and the exact shape of the final report/sources data your Task 3
code will need to parse. This file is the ground truth Task 3 is written against —
if you find the real behavior differs from what's described in the spec's
"Architecture" section, that's expected; Task 3 below is written to be adjusted based
on this file's findings (see the note at the top of Task 3).

```bash
cd D:/AgentDevWork/repos/.mint/MINT
git add docs/superpowers/specs/2026-09-19-gpt-researcher-spike-notes.md
git commit -m "docs: spike findings for GPT Researcher WS protocol"
```

Delete the throwaway venv/clone afterward — `rm -rf D:/Temp/claude/gptr-spike`.

---

## Task 1: Fix the pre-existing `createResearch()` source/citations bug

This is a prerequisite, independent of the spike — it's a real bug in the existing
code (confirmed by reading it, not speculation) that Task 4 depends on being fixed
first: `createResearch()` hardcodes `source: 'ai'` regardless of what's passed in, and
doesn't accept `citations` at all.

**Files:**
- Modify: `backend/src/services/research.service.ts:1-30`
- Modify: `backend/src/routes/research.routes.ts:30-46`
- Test: `backend/src/services/research.service.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/research.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db.js', () => ({
  prisma: {
    researchReport: {
      create: vi.fn(),
    },
    contentProject: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from './db.js';
import { createResearch } from './research.service.js';

describe('createResearch', () => {
  beforeEach(() => {
    vi.mocked(prisma.researchReport.create).mockReset();
  });

  it('persists the caller-supplied source instead of hardcoding "ai"', async () => {
    vi.mocked(prisma.researchReport.create).mockResolvedValue({ id: 'r1' } as any);

    await createResearch('user-1', {
      query: 'test query',
      summary: 'test summary',
      source: 'gpt-researcher',
    });

    expect(prisma.researchReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'gpt-researcher' }),
      }),
    );
  });

  it('serializes citations as JSON when provided', async () => {
    vi.mocked(prisma.researchReport.create).mockResolvedValue({ id: 'r1' } as any);

    await createResearch('user-1', {
      query: 'test query',
      summary: 'test summary',
      source: 'gpt-researcher',
      citations: [{ title: 'Example', url: 'https://example.com' }],
    });

    const call = vi.mocked(prisma.researchReport.create).mock.calls[0][0] as any;
    expect(JSON.parse(call.data.citations)).toEqual([
      { title: 'Example', url: 'https://example.com' },
    ]);
  });

  it('defaults source to "ai" when not supplied, for backward compatibility', async () => {
    vi.mocked(prisma.researchReport.create).mockResolvedValue({ id: 'r1' } as any);

    await createResearch('user-1', { query: 'q', summary: 's' });

    expect(prisma.researchReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ source: 'ai' }) }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run backend/src/services/research.service.test.ts`
Expected: FAIL — `source: 'gpt-researcher'` assertion fails because the current code
always writes `source: 'ai'`; the citations test fails because `citations` isn't in
the Zod schema and gets silently dropped by `.parse()`.

- [ ] **Step 3: Fix `createResearch()`**

Modify `backend/src/services/research.service.ts` — replace the top of the file:

```typescript
import { prisma } from './db.js';
import { z } from 'zod';

const createResearchSchema = z.object({
  projectId: z.string().min(1).optional(),
  query: z.string().min(1).max(2000),
  summary: z.string().optional(),
  source: z.string().default('ai'),
  citations: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
});

export async function createResearch(userId: string, input: unknown) {
  const data = createResearchSchema.parse(input);
  let projectId = data.projectId || null;

  if (data.projectId) {
    const project = await prisma.contentProject.findFirst({ where: { id: data.projectId, userId } });
    if (!project) {
      throw new Error('Project not found');
    }
    projectId = project.id;
  }

  return prisma.researchReport.create({
    data: {
      projectId,
      query: data.query,
      source: data.source,
      summary: data.summary || `${data.query}\n\n[research placeholder]`,
      citations: data.citations ? JSON.stringify(data.citations) : undefined,
      userId,
    },
  });
}
```

(Leave `listResearch`, `getResearch`, `deleteResearch` in that file unchanged.)

- [ ] **Step 4: Update the existing route to pass `source` through explicitly**

Modify `backend/src/routes/research.routes.ts` — in the `POST /research` handler,
change the `createResearch` call:

```typescript
    const { createResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    const report = await createResearch(userId, {
      projectId: undefined,
      query: body.query,
      summary: result.output,
      source: result.provider,
    });
```

(This is the only change to this file in this task — everything else stays as-is.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run backend/src/services/research.service.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/research.service.ts backend/src/routes/research.routes.ts backend/src/services/research.service.test.ts
git commit -m "fix: createResearch() no longer hardcodes source, accepts citations"
```

---

## Task 2: Add `@fastify/websocket` and register the plugin

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/src/index.ts:1-40`

- [ ] **Step 1: Install the dependency**

```bash
cd backend
npm install @fastify/websocket@^11
cd ..
```

- [ ] **Step 2: Register the plugin**

Modify `backend/src/index.ts` — add the import near the other `@fastify/*` imports:

```typescript
import websocket from '@fastify/websocket';
```

And register it, right after the existing `await app.register(helmet as any, ...)` line:

```typescript
  await app.register(websocket);
```

- [ ] **Step 3: Verify the backend still boots**

Run: `cd backend && npx tsx src/index.ts &` then `curl http://localhost:4000/health`
Expected: `{"status":"ok"}` (or whatever the existing health payload shape is — confirm
against the current `/health` handler, don't guess the exact JSON). Kill the process
afterward.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/index.ts
git commit -m "chore: add @fastify/websocket for the research streaming endpoint"
```

---

## Task 3: `gptResearcher.service.ts` — WebSocket client to the local GPT Researcher server

> **Before starting this task, read `docs/superpowers/specs/2026-09-19-gpt-researcher-spike-notes.md` (produced by Task 0) and adjust Step 3's `parseCompletion()` implementation to match its actual findings** — specifically how the final report text and sources are obtained (inline WS message vs. fetching the `.json` output file, and whether that fetch is over HTTP or local disk read). The code below implements the "fetch the `.json` output file over HTTP from the same host" case, which is the most likely outcome given GPT Researcher's server typically mounts its `outputs/` directory statically — but this line is exactly what Task 0 exists to confirm or correct.

**Files:**
- Create: `backend/src/services/ai/gptResearcher.service.ts`
- Test: `backend/src/services/ai/gptResearcher.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/ai/gptResearcher.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWsInstances: any[] = [];

vi.mock('ws', () => {
  class MockWebSocket {
    static OPEN = 1;
    readyState = 0;
    listeners: Record<string, Function[]> = {};
    sentMessages: string[] = [];
    constructor(public url: string) {
      mockWsInstances.push(this);
    }
    on(event: string, cb: Function) {
      (this.listeners[event] ||= []).push(cb);
      return this;
    }
    send(data: string) {
      this.sentMessages.push(data);
    }
    close() {
      this.emit('close');
    }
    emit(event: string, ...args: any[]) {
      for (const cb of this.listeners[event] || []) cb(...args);
    }
  }
  return { default: MockWebSocket, WebSocket: MockWebSocket };
});

import { runResearch } from './gptResearcher.service.js';

describe('runResearch', () => {
  beforeEach(() => {
    mockWsInstances.length = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          report: '# Report\n\nSynthesized content.',
          sources: [{ title: 'Example Source', url: 'https://example.com/a' }],
        }),
      })),
    );
  });

  it('sends the start command with the task payload', async () => {
    const promise = runResearch('best video hooks 2026', { onProgress: () => {} });
    const ws = mockWsInstances[0];
    ws.emit('open');
    expect(ws.sentMessages[0]).toMatch(/^start /);
    const payload = JSON.parse(ws.sentMessages[0].slice('start '.length));
    expect(payload.task).toBe('best video hooks 2026');
    expect(payload.report_type).toBe('research_report');
    expect(payload.report_source).toBe('web');

    ws.emit(
      'message',
      JSON.stringify({ type: 'path', output: { json: '/outputs/abc123.json' } }),
    );
    const result = await promise;
    expect(result.report).toContain('Synthesized content.');
    expect(result.sources).toEqual([{ title: 'Example Source', url: 'https://example.com/a' }]);
  });

  it('forwards logs messages via onProgress', async () => {
    const progress: string[] = [];
    const promise = runResearch('q', { onProgress: (msg) => progress.push(msg) });
    const ws = mockWsInstances[0];
    ws.emit('open');
    ws.emit('message', JSON.stringify({ type: 'logs', content: 'searching', output: 'Searching the web...' }));
    ws.emit('message', JSON.stringify({ type: 'path', output: { json: '/outputs/x.json' } }));
    await promise;
    expect(progress).toContain('Searching the web...');
  });

  it('rejects when the connection errors before completion', async () => {
    const promise = runResearch('q', { onProgress: () => {} });
    const ws = mockWsInstances[0];
    ws.emit('error', new Error('ECONNREFUSED'));
    await expect(promise).rejects.toThrow(/ECONNREFUSED|connect/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run backend/src/services/ai/gptResearcher.service.test.ts`
Expected: FAIL with "Cannot find module './gptResearcher.service.js'"

- [ ] **Step 3: Implement the service**

Create `backend/src/services/ai/gptResearcher.service.ts`:

```typescript
import WebSocket from 'ws';

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchResult {
  report: string;
  sources: ResearchSource[];
}

export interface RunResearchOptions {
  onProgress: (message: string) => void;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 180_000; // real web research can take 30-90s+ locally

function baseUrl(): string {
  return process.env.GPT_RESEARCHER_BASE_URL || 'http://localhost:8002';
}

function wsUrl(): string {
  return baseUrl().replace(/^http/, 'ws') + '/ws';
}

async function fetchCompletion(jsonPath: string): Promise<ResearchResult> {
  // jsonPath is a server-relative path like "/outputs/abc123.json" from the
  // final "path" message. Task 0's spike confirms whether this is reachable
  // over plain HTTP from the GPT Researcher server (the common case, since it
  // typically serves its outputs/ dir as static files) — adjust this function
  // if the spike found otherwise.
  const url = `${baseUrl()}${jsonPath}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`Failed to fetch GPT Researcher output (${res.status}): ${url}`);
  }
  const data = (await res.json()) as { report?: string; sources?: ResearchSource[] };
  return {
    report: data.report || '',
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

export function runResearch(task: string, options: RunResearchOptions): Promise<ResearchResult> {
  const { onProgress, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  return new Promise<ResearchResult>((resolve, reject) => {
    const ws = new WebSocket(wsUrl());
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.close();
      reject(new Error('GPT Researcher request timed out'));
    }, timeoutMs);

    function finish(fn: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      fn();
    }

    ws.on('open', () => {
      const payload = {
        task,
        report_type: 'research_report',
        report_source: 'web',
        tone: 'Analytical',
        source_urls: [],
        document_urls: [],
      };
      ws.send('start ' + JSON.stringify(payload));
    });

    ws.on('message', (raw: Buffer) => {
      let data: any;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (data.type === 'logs' && typeof data.output === 'string') {
        onProgress(data.output);
        return;
      }

      if (data.type === 'path' && data.output?.json) {
        fetchCompletion(data.output.json)
          .then((result) => {
            finish(() => resolve(result));
            ws.close();
          })
          .catch((err) => {
            finish(() => reject(err));
            ws.close();
          });
      }
    });

    ws.on('error', (err: Error) => {
      finish(() => reject(err));
    });

    ws.on('close', () => {
      finish(() => reject(new Error('GPT Researcher connection closed before completion')));
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run backend/src/services/ai/gptResearcher.service.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Install the `ws` package if not already present**

```bash
cd backend
grep -q '"ws"' package.json || npm install ws && npm install -D @types/ws
cd ..
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/ai/gptResearcher.service.ts backend/src/services/ai/gptResearcher.service.test.ts backend/package.json backend/package-lock.json
git commit -m "feat: gptResearcher.service.ts — WS client for the local GPT Researcher server"
```

---

## Task 4: `/research/stream` WebSocket route with auth and fallback

**Files:**
- Modify: `backend/src/routes/research.routes.ts`

- [ ] **Step 1: Add the streaming route**

Modify `backend/src/routes/research.routes.ts` — add these imports at the top:

```typescript
import { config } from '../config.js';
```

Add this route inside `export default async function researchRoutes(fastify: FastifyInstance) {`, after the existing `POST /research` handler:

```typescript
  fastify.get('/research/stream', { websocket: true }, async (socket, request) => {
    // @fastify/websocket v11's handler receives the raw WebSocket directly as
    // the first argument (not wrapped in a `connection.socket`, which was the
    // pre-v8 shape) — confirmed against the current README, not guessed.

    // WS handshakes can't carry an Authorization header — accept the token as
    // a query param instead. Known tradeoff: tokens in URLs can leak into
    // access logs/history; acceptable here since MINT is single-user/localhost.
    let userId: string;
    if (config.disableAuth) {
      userId = 'single-user';
    } else {
      const token = (request.query as { token?: string })?.token;
      if (!token) {
        socket.close(4001, 'Missing token');
        return;
      }
      try {
        const decoded = (await fastify.jwt.verify(token)) as { sub: string; email?: string };
        userId = decoded.sub || decoded.email || 'unknown';
      } catch {
        socket.close(4001, 'Invalid token');
        return;
      }
    }

    socket.on('message', async (raw: Buffer) => {
      let msg: { query?: string };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        return;
      }
      const query = msg.query?.trim();
      if (!query) {
        socket.send(JSON.stringify({ type: 'error', message: 'Missing query' }));
        return;
      }

      const { createResearch } = await import('../services/research.service.js');
      const { runResearch } = await import('../services/ai/gptResearcher.service.js');

      try {
        const result = await runResearch(query, {
          onProgress: (message) => {
            socket.send(JSON.stringify({ type: 'progress', message }));
          },
        });

        const report = await createResearch(userId, {
          query,
          summary: result.report,
          source: 'gpt-researcher',
          citations: result.sources,
        });

        socket.send(
          JSON.stringify({
            type: 'done',
            report: result.report,
            sources: result.sources,
            id: report?.id,
          }),
        );
      } catch (err) {
        // GPT Researcher unreachable or failed after connecting — fall back
        // to the existing LLM-guess path rather than leaving the user with
        // nothing.
        socket.send(JSON.stringify({ type: 'progress', message: 'Falling back to local AI (research service unavailable)' }));

        try {
          const { getAIProviderAsync } = await import('../services/ai/index.js');
          const provider = await getAIProviderAsync();
          const result = await provider.generateText({
            prompt: researchPrompt(query),
            temperature: 0.3,
            maxTokens: 3072,
          });

          const report = await createResearch(userId, {
            query,
            summary: result.output,
            source: 'ai-fallback',
          });

          socket.send(
            JSON.stringify({
              type: 'done',
              report: result.output,
              sources: [],
              id: report?.id,
            }),
          );
        } catch (fallbackErr) {
          socket.send(
            JSON.stringify({
              type: 'error',
              message: (fallbackErr as Error).message || 'Research failed',
            }),
          );
        }
      }
    });

    socket.on('close', () => {
      // nothing to clean up — runResearch's own promise settles independently
    });
  });
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `npx vitest run backend/src/services/research.service.test.ts backend/src/services/ai/gptResearcher.service.test.ts`
Expected: PASS (all 6 tests from Tasks 1 and 3)

- [ ] **Step 3: Manual smoke test (requires Task 0's spike server or a real GPT Researcher instance running on :8002)**

```bash
npm run backend:dev
```

In another terminal, use `wscat` (or any WS client) against
`ws://localhost:4000/research/stream?token=dev-token` (dev mode auto-verifies), send
`{"query": "test topic"}`, and confirm you receive `progress` messages followed by a
`done` message with a non-empty `report` and `sources` array.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/research.routes.ts
git commit -m "feat: /research/stream WS route with GPT Researcher + LLM-guess fallback"
```

---

## Task 5: Settings page reachability row for GPT Researcher

**Files:**
- Modify: `backend/src/routes/settings.routes.ts:25-68`

- [ ] **Step 1: Add the new service to `gatherStatuses()`**

Modify `backend/src/routes/settings.routes.ts` — inside `gatherStatuses()`, after the
existing `if (moneyPrinter) { ... }` block:

```typescript
  const gptResearcher = process.env.GPT_RESEARCHER_BASE_URL || null;
  if (gptResearcher) {
    out.push({
      name: 'gpt-researcher',
      url: gptResearcher,
      reachable: await ping(gptResearcher),
      detail: 'Real web research for the Research page. Model is set at service startup — changing the Ollama model above does not update it until the service is restarted.',
    });
  }
```

- [ ] **Step 2: Verify the backend still boots and the route responds**

Run: `npm run backend:dev` then in another terminal
`curl -H "Authorization: Bearer dev-token" http://localhost:4000/api/settings/services`
Expected: JSON response's `services` array includes a `gpt-researcher` entry only if
`GPT_RESEARCHER_BASE_URL` is set in `backend/.env` (matches the ComfyUI/MPT pattern —
if you haven't set that env var yet, confirm the entry is *absent*, not present with
`reachable: false`, which is the existing convention this code follows).

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/settings.routes.ts
git commit -m "feat: add gpt-researcher to Settings service reachability list"
```

---

## Task 6: `useResearchStream` frontend hook

**Files:**
- Create: `frontend/src/hooks/useResearchStream.ts`
- Test: `frontend/src/hooks/useResearchStream.test.ts`

- [ ] **Step 1: Confirmed — the token accessor**

`frontend/src/lib/api/auth.ts` exports `authApi.getSession(): Promise<Session | null>`
(async — reads `localStorage`, or returns a hardcoded desktop session under Tauri).
`session.accessToken` is the token string. This is async, so Step 4's hook needs to
`await authApi.getSession()` before opening the socket — not a synchronous call.

- [ ] **Step 2: Write the failing test**

Create `frontend/src/hooks/useResearchStream.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResearchStream } from './useResearchStream';

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    getSession: vi.fn(async () => ({
      user: { id: 'u1', email: 'u@test.local' },
      accessToken: 'test-token',
      expiresAt: '9999999999999',
    })),
  },
}));

const mockSockets: any[] = [];

class MockWebSocket {
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  constructor(public url: string) {
    mockSockets.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.onclose?.();
  }
}

beforeEach(() => {
  mockSockets.length = 0;
  vi.stubGlobal('WebSocket', MockWebSocket as any);
});

describe('useResearchStream', () => {
  it('goes idle -> researching -> done on a successful run', async () => {
    const { result } = renderHook(() => useResearchStream());

    act(() => {
      result.current.start('test query');
    });

    // connect() awaits authApi.getSession() before constructing the socket,
    // so the mock socket only exists after that microtask resolves.
    await waitFor(() => expect(mockSockets.length).toBe(1));
    const socket = mockSockets[0];

    act(() => {
      socket.readyState = MockWebSocket.OPEN;
      socket.onopen?.();
    });
    expect(result.current.status).toBe('researching');
    expect(socket.sent[0]).toBe(JSON.stringify({ query: 'test query' }));

    act(() => {
      socket.onmessage?.({ data: JSON.stringify({ type: 'progress', message: 'Searching...' }) });
    });
    expect(result.current.logs).toContain('Searching...');

    act(() => {
      socket.onmessage?.({
        data: JSON.stringify({ type: 'done', report: '# Report', sources: [], id: 'r1' }),
      });
    });

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.result?.report).toBe('# Report');
  });

  it('goes to error status on a server error message', async () => {
    const { result } = renderHook(() => useResearchStream());
    act(() => {
      result.current.start('q');
    });
    await waitFor(() => expect(mockSockets.length).toBe(1));
    const socket = mockSockets[0];
    act(() => {
      socket.readyState = MockWebSocket.OPEN;
      socket.onopen?.();
      socket.onmessage?.({ data: JSON.stringify({ type: 'error', message: 'boom' }) });
    });
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run frontend/src/hooks/useResearchStream.test.ts`
Expected: FAIL with "Cannot find module './useResearchStream'"

- [ ] **Step 4: Implement the hook**

Create `frontend/src/hooks/useResearchStream.ts`:

```typescript
import { useCallback, useRef, useState } from 'react';
import { authApi } from '@/lib/api/auth';

export type ResearchStreamStatus = 'idle' | 'connecting' | 'researching' | 'done' | 'error';

export interface ResearchStreamResult {
  report: string;
  sources: { title: string; url: string }[];
  id?: string;
}

export function useResearchStream() {
  const [status, setStatus] = useState<ResearchStreamStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ResearchStreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectedRef = useRef(false);

  const connect = useCallback(async (query: string) => {
    const session = await authApi.getSession();
    const token = session?.accessToken || '';
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/^http/, 'ws').replace(/\/api$/, '');
    const wsUrl = `${base || location.origin.replace(/^http/, 'ws')}/api/research/stream?token=${encodeURIComponent(token)}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('researching');
      socket.send(JSON.stringify({ query }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setLogs((prev) => [...prev, data.message]);
      } else if (data.type === 'done') {
        setResult({ report: data.report, sources: data.sources || [], id: data.id });
        setStatus('done');
      } else if (data.type === 'error') {
        setError(data.message);
        setStatus('error');
      }
    };

    socket.onerror = () => {
      setStatus((current) => {
        if (current !== 'done' && !reconnectedRef.current) {
          reconnectedRef.current = true;
          connect(query);
          return current;
        }
        setError('Connection lost');
        return 'error';
      });
    };

    socket.onclose = () => {
      socketRef.current = null;
    };
  }, []);

  const start = useCallback(
    (query: string) => {
      reconnectedRef.current = false;
      setLogs([]);
      setResult(null);
      setError(null);
      setStatus('connecting');
      connect(query);
    },
    [connect],
  );

  const stop = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setStatus('idle');
  }, []);

  return { status, logs, result, error, start, stop };
}
```

(Note: `setStatus((current) => ...)` is used as a read-and-branch trick inside
`onerror` since the hook has no other way to read current status without a stale
closure over `status` — this avoids re-creating `connect` on every status change,
which the earlier draft's `[status]` dependency would have caused.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run frontend/src/hooks/useResearchStream.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useResearchStream.ts frontend/src/hooks/useResearchStream.test.ts
git commit -m "feat: useResearchStream hook for live research progress"
```

---

## Task 7: Rebuild `Research.tsx`

**Files:**
- Modify: `frontend/src/pages/Research.tsx` (currently 33 lines, a bare form with no
  report display at all)

- [ ] **Step 1: Check the existing report-list styling conventions**

Read `frontend/src/pages/Library.tsx` first (it's the closest existing "list of items
with detail" page) to match MINT's existing Tailwind conventions before writing new
markup — don't invent a new visual style for this page.

- [ ] **Step 2: Rewrite the page**

Replace `frontend/src/pages/Research.tsx` in full:

```typescript
import { useEffect, useState } from 'react';
import { useResearch } from '@/stores/research';
import { useResearchStream } from '@/hooks/useResearchStream';

export default function Research() {
  const [query, setQuery] = useState('');
  const { data, refetch } = useResearch();
  const stream = useResearchStream();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    stream.start(query.trim());
  };

  // Refetch exactly once per completed run, not on every render — `stream.result`
  // is a stable reference set once by the 'done' message, so this effect only
  // re-fires when a *new* result object arrives.
  useEffect(() => {
    if (stream.status === 'done' && stream.result) {
      refetch();
    }
  }, [stream.status, stream.result, refetch]);

  const reports = data?.reports ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-black uppercase text-white">Research</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={stream.status === 'connecting' || stream.status === 'researching'}
          className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
          placeholder="Competitor or keyword"
        />
        <button
          type="submit"
          disabled={stream.status === 'connecting' || stream.status === 'researching'}
          className="h-12 rounded-2xl bg-mint-500 px-6 font-black uppercase tracking-[0.2em] text-mint-950 hover:brightness-110 disabled:opacity-60"
        >
          Run
        </button>
      </form>

      {(stream.status === 'connecting' || stream.status === 'researching') && (
        <div className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-4 text-xs text-muted-foreground">
          {stream.logs.length === 0 ? (
            <p>Connecting...</p>
          ) : (
            <ul className="space-y-1">
              {stream.logs.map((log, i) => (
                <li key={i}>{log}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {stream.status === 'error' && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {stream.error || 'Research failed.'}
          <button
            onClick={() => stream.start(query)}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {reports.map((report: any) => {
          const citations = report.citations ? JSON.parse(report.citations) : [];
          const isReal = report.source === 'gpt-researcher';
          return (
            <div key={report.id} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">{report.query}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isReal ? 'bg-mint-500/20 text-mint-300' : 'bg-white/10 text-muted-foreground'
                  }`}
                >
                  {isReal ? 'Web Research' : 'AI Guess'}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{report.summary}</p>
              {citations.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs">
                  {citations.map((c: { title: string; url: string }, i: number) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-mint-400 hover:underline">
                        {c.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Check `useResearch()`'s call signature matches this usage**

Read `frontend/src/stores/research.ts` (already read earlier in this project) —
confirm `useResearch()` with no `projectId` arg works given its current
`enabled: Boolean(projectId)` guard. **This is a real bug this task must also fix**:
today's `useResearch(projectId?)` never fires when `projectId` is undefined, so the
page-level "list all reports" case (this page's actual need) never worked. Change
`frontend/src/stores/research.ts`'s `useResearch` to default the query to "all
reports" when no `projectId` is given:

```typescript
export function useResearch(projectId?: string) {
  return useQuery({
    queryKey: ['research', projectId ?? null],
    queryFn: async () => {
      const url = projectId ? `/research?projectId=${encodeURIComponent(projectId)}` : '/research';
      const res = await apiClient.get(url);
      return res.json();
    },
  });
}
```

(Just removes the `enabled: Boolean(projectId)` line so it always fetches.)

- [ ] **Step 4: Manual verification**

```bash
npm run dev:all
```

Open `http://localhost:5173/app/research`, submit a query, confirm: progress log
lines appear, a report shows up with a "Web Research" badge and clickable sources (if
GPT Researcher is running) or an "AI Guess" badge with no sources (if it's not).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Research.tsx frontend/src/stores/research.ts
git commit -m "feat: rebuild Research page with live progress, report list, citations"
```

---

## Task 8: Installer + docs

**Files:**
- Create: `installer/download-gptresearcher.bat`
- Modify: `installer/MINT_Setup_Personal.iss`
- Modify: `backend/.env.example`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Create the installer helper script**

Create `installer/download-gptresearcher.bat`:

```bat
@echo off
REM Installs GPT Researcher into a local venv and writes its .env for MINT.
REM Usage: download-gptresearcher.bat <install-dir>

set INSTALL_DIR=%~1
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%CD%

echo Checking for Python...
where python >nul 2>nul
if errorlevel 1 (
  echo Python not found. Please install Python 3.10+ from https://python.org and re-run.
  exit /b 1
)

echo Creating GPT Researcher venv...
python -m venv "%INSTALL_DIR%\gpt-researcher-venv"
call "%INSTALL_DIR%\gpt-researcher-venv\Scripts\activate.bat"
pip install gpt-researcher fastapi "uvicorn[standard]" python-dotenv

echo RETRIEVER=duckduckgo> "%INSTALL_DIR%\gpt-researcher.env"
echo FAST_LLM=ollama:llama3.2>> "%INSTALL_DIR%\gpt-researcher.env"
echo SMART_LLM=ollama:llama3.2>> "%INSTALL_DIR%\gpt-researcher.env"
echo OLLAMA_BASE_URL=http://localhost:11434>> "%INSTALL_DIR%\gpt-researcher.env"

echo GPT Researcher installed. Start it with:
echo   cd "%INSTALL_DIR%\gpt-researcher-venv" ^&^& python -m uvicorn main:app --port 8002
```

- [ ] **Step 2: Add the installer checkbox**

Modify `installer/MINT_Setup_Personal.iss` — in `[Tasks]`, after the existing
`installcomfyui` line:

```
Name: "installgptresearcher"; Description: "Install GPT Researcher (real web research for the Research page)"; GroupDescription: "AI Services:"
```

In `[Run]`, after the existing `installcomfyui` line:

```
Filename: "{app}\installer\download-gptresearcher.bat"; Parameters: "{app}"; StatusMsg: "Installing GPT Researcher..."; Tasks: installgptresearcher; Flags: runhidden waituntilterminated shellexec
```

In `[Files]`, alongside the other `installer\*.bat` entries:

```
Source: "download-gptresearcher.bat"; DestDir: "{app}\installer"; Flags: ignoreversion
```

- [ ] **Step 3: Document the env var**

Modify `backend/.env.example` — add near the existing `RESEARCH_PROVIDER`/
`BRAVE_SEARCH_API_KEY` lines:

```env
# Research: GPT Researcher local service (real web search). Leave unset to
# keep today's LLM-guess fallback behavior.
GPT_RESEARCHER_BASE_URL=http://localhost:8002
```

- [ ] **Step 4: Update README and AGENTS.md**

In `README.md`'s "Local AI Services" table, add a row:

```
| **GPT Researcher** | 8002 | Real web research | Optional. Set `GPT_RESEARCHER_BASE_URL` in `.env`. Install via the Personal installer's checkbox, or `pip install gpt-researcher` manually (see docs/superpowers/specs/2026-09-19-gpt-researcher-design.md). |
```

In `AGENTS.md`'s "## Local Services" section, add:

```
- **GPT Researcher**: http://localhost:8002 (optional) — real web research for
  `/app/research`; falls back to an LLM guess if unreachable. Uses DuckDuckGo (no
  API key) and MINT's own Ollama for synthesis.
```

- [ ] **Step 5: Commit**

```bash
git add installer/download-gptresearcher.bat installer/MINT_Setup_Personal.iss backend/.env.example README.md AGENTS.md
git commit -m "docs+installer: document and add optional install for GPT Researcher"
```

---

## Self-Review Notes

**Spec coverage check:**
- DuckDuckGo retriever, port 8002, persistent service → Task 0 (env), Task 8 (installer/docs). ✓
- Reuse MINT's Ollama for synthesis → Task 0's `.env` template, Task 8's installer script. ✓
- Fallback to LLM-guess, tagged `ai-fallback` → Task 4. ✓
- Installer checkbox → Task 8. ✓
- Content-creator report framing → Task 3's `tone`/payload (kept simple; the spec's
  more elaborate custom-prompt framing was descoped to a plain `tone: "Analytical"`
  since Task 0's spike is what determines whether GPT Researcher's API even exposes a
  free-text prompt override beyond `tone` — if it does, revisit Task 3's payload after
  the spike, noted inline in Task 3's header). — **gap flagged, not silently dropped.**
- Citations stored/shown → Task 1 (schema), Task 7 (UI). ✓
- Live WS progress → Tasks 2, 3, 4, 6, 7. ✓
- Settings reachability row → Task 5. ✓
- JWT-in-query-string auth → Task 4. ✓
- Model-selection-desync documented → Task 5's `detail` text. ✓
- Error handling (unreachable, mid-stream drop, frontend reconnect) → Task 4 (server
  side), Task 6 (client reconnect-once). ✓

**Known deviation from the spec worth calling out again:** the spec assumed the final
report/sources arrive inline over the WebSocket; the confirmed protocol (before Task
0's spike even runs) shows the server sends file *paths*, not inline content. Task 3
is written against the most-likely resolution (fetch the JSON output over HTTP) but
explicitly flagged as needing Task 0's confirmation before being taken as final.
