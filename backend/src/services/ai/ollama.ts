import type { AIProvider, TextGenOptions, TextGenResult } from './provider.js';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl: string, defaultModel = 'llama3.1:8b') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
  }

  async generateText({ prompt, system, model, maxTokens, temperature }: TextGenOptions): Promise<TextGenResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || this.defaultModel,
          prompt,
          system: system || undefined,
          options: {
            ...(maxTokens ? { num_predict: maxTokens } : {}),
            ...(temperature ? { temperature } : {}),
          },
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const details = await res.text().catch(() => '');
        throw new Error(`Ollama failed (${res.status}): ${details || res.statusText}`);
      }

      const json = (await res.json()) as { response?: string };
      if (!json.response) throw new Error('Ollama returned empty response');
      return { output: json.response, model: model || this.defaultModel, provider: 'ollama' };
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw new Error('Ollama request timed out after 60s');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
