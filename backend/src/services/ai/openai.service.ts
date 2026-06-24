import { URL } from 'url';

export interface OpenAIGenOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIChatPayload {
  model: string;
  input: string;
  instructions?: string;
}

export async function generateOpenAIContent({ prompt, system, model = 'gpt-4o-mini', maxTokens = 1024, temperature = 0.4 }: OpenAIGenOptions) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const target = new URL('/responses', baseUrl);

  const payload: OpenAIChatPayload = {
    model,
    input: prompt,
    instructions: system || undefined,
  };

  const bearer = `Bearer ${apiKey}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: bearer,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(target.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(`OpenAI generation failed (${response.status}): ${details || response.statusText}`);
      }

      const json = (await response.json()) as { output_text?: string; output?: Array<{ text?: string }> };
      const text = json.output_text ?? json.output?.[0]?.text ?? '';
      return { output: text || '', model, provider: 'openai' };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`OpenAI generation aborted after 30s (attempt ${attempt})`);
      }
      if (attempt < 3) await sleep(400 * attempt);
    }
  }

  throw lastError ?? new Error('OpenAI generation failed');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
