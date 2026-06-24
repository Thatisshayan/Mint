import { type AIProvider } from './provider.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { OllamaProvider } from './ollama.js';

export type { AIProvider, TextGenOptions, TextGenResult, ImageGenOptions, ImageGenResult } from './provider.js';
export { scriptPrompt, captionPrompt, thumbnailPrompt, hookPrompt, scenarioPrompt } from './prompts.js';
export type { PromptInput } from './prompts.js';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const primary = process.env.LLM_PROVIDER || 'deepseek';

  if (primary === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      provider = new OpenAICompatibleProvider({
        apiKey,
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        name: 'deepseek',
      });
      return provider;
    }
  }

  if (primary === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      provider = new OpenAICompatibleProvider({
        apiKey,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        name: 'openai',
      });
      return provider;
    }
  }

  // Fallback to Ollama
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  provider = new OllamaProvider(ollamaUrl);
  return provider;
}

export function resetAIProvider(): void {
  provider = null;
}
