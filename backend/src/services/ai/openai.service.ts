import { URL } from 'url';

export interface OpenAIGenOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateOpenAIContent({ prompt, system, model = 'gpt-4o-mini', maxTokens = 1024, temperature = 0.4 }: OpenAIGenOptions) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const target = new URL('/chat/completions', baseUrl);

  const messages: Array<{ role: string; content: string }> = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(target.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(`OpenAI generation failed (${response.status}): ${details || response.statusText}`);
      }

      const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content ?? '';
      return { output: text || '', model, provider: 'openai' };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`OpenAI generation aborted after 30s (attempt ${attempt})`);
      }
      if (attempt < 3) await sleep(400 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('OpenAI generation failed');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
