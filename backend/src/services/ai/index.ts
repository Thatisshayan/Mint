import { type AIProvider } from './provider.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { OllamaProvider } from './ollama.js';
import { getCircuitBreaker } from '../../lib/circuitBreaker.js';
import { logger } from '../../lib/logger.js';
import { discover as discoverOllama } from './ollama-discovery.js';

export type { AIProvider, TextGenOptions, TextGenResult, ImageGenOptions, ImageGenResult } from './provider.js';
export { scriptPrompt, captionPrompt, thumbnailPrompt, hookPrompt, scenarioPrompt } from './prompts.js';
export type { PromptInput } from './prompts.js';

let provider: AIProvider | null = null;

function createProviderWithCircuitBreaker(name: string, providerInstance: AIProvider): AIProvider {
  const circuitBreaker = getCircuitBreaker(name, {
    failureThreshold: 3,
    recoveryTimeoutMs: 60000,
  });

  return {
    generateText: async (options) => {
      return circuitBreaker.execute(async () => {
        logger.info(`AI call to ${name}`, { model: options.model });
        return providerInstance.generateText(options);
      });
    },
  };
}

export async function getAIProviderAsync(): Promise<AIProvider> {
  if (provider) return provider;

  const primary = process.env.LLM_PROVIDER || 'ollama';

  if (primary === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const instance = new OpenAICompatibleProvider({
        apiKey,
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        name: 'deepseek',
      });
      provider = createProviderWithCircuitBreaker('deepseek', instance);
      return provider;
    }
  }

  if (primary === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const instance = new OpenAICompatibleProvider({
        apiKey,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        name: 'openai',
      });
      provider = createProviderWithCircuitBreaker('openai', instance);
      return provider;
    }
  }

  // Ollama: pick a real model from what's installed; fall back to env override.
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const discovery = await discoverOllama();
  const defaultModel =
    process.env.OLLAMA_DEFAULT_MODEL ||
    discovery.selectedModel ||
    'llama3.1:8b'; // last-resort; will surface as a 404 in the UI

  const instance = new OllamaProvider(ollamaUrl, defaultModel);
  provider = createProviderWithCircuitBreaker('ollama', instance);
  return provider;
}

export function getAIProvider(): AIProvider {
  // Backwards-compatible sync accessor. First call blocks on Ollama discovery
  // when the chain lands on Ollama. Subsequent calls return the cached instance.
  if (provider) return provider;

  // For non-Ollama branches we can resolve synchronously.
  const primary = process.env.LLM_PROVIDER || 'ollama';
  if (primary === 'deepseek' && (process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY)) {
    const instance = new OpenAICompatibleProvider({
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
      name: 'deepseek',
    });
    provider = createProviderWithCircuitBreaker('deepseek', instance);
    return provider;
  }
  if (primary === 'openai' && process.env.OPENAI_API_KEY) {
    const instance = new OpenAICompatibleProvider({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
      name: 'openai',
    });
    provider = createProviderWithCircuitBreaker('openai', instance);
    return provider;
  }

  // Ollama path requires async discovery; fall through with a placeholder and
  // call out to the async path on next request via resetAIProvider() if needed.
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const instance = new OllamaProvider(ollamaUrl, process.env.OLLAMA_DEFAULT_MODEL || 'llama3.1:8b');
  provider = createProviderWithCircuitBreaker('ollama', instance);
  return provider;
}

export function resetAIProvider(): void {
  provider = null;
}
