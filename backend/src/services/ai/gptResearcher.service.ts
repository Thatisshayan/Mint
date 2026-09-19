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
  // final "path" message. Best-effort assumption (not locally verified in
  // this session — see docs/superpowers/specs/2026-09-19-gpt-researcher-spike-notes.md):
  // GPT Researcher's FastAPI server serves its outputs/ dir as static files.
  // If this turns out wrong once verified, this is the one function that
  // needs to change (e.g. to read the file from local disk instead, if
  // MINT and GPT Researcher are confirmed to always run on the same host).
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
