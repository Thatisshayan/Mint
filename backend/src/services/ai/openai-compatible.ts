import { URL } from 'url';
import type { AIProvider, TextGenOptions, TextGenResult } from './provider.js';

export class OpenAICompatibleProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private name: string;

  constructor(config: { apiKey: string; baseUrl: string; defaultModel: string; name: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.defaultModel = config.defaultModel;
    this.name = config.name;
  }

  async generateText({ prompt, system, model, maxTokens = 2048, temperature = 0.4 }: TextGenOptions): Promise<TextGenResult> {
    const messages: Array<{ role: string; content: string }> = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const url = new URL('/chat/completions', this.baseUrl);

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      try {
        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify({ model: model || this.defaultModel, messages, max_tokens: maxTokens, temperature }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const details = await res.text().catch(() => '');
          throw new Error(`${this.name} API failed (${res.status}): ${details || res.statusText}`);
        }

        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const text = json.choices?.[0]?.message?.content ?? '';
        return { output: text, model: model || this.defaultModel, provider: this.name };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if ((err as Error).name === 'AbortError') throw new Error(`${this.name} request timed out after 60s`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 500 * attempt));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError ?? new Error(`${this.name} generation failed`);
  }
}
