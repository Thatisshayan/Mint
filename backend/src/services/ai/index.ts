import { type AIProvider } from './provider.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { OllamaProvider } from './ollama.js';
import { getCircuitBreaker } from '../../lib/circuitBreaker.js';
import { logger } from '../../lib/logger.js';

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

export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const primary = process.env.LLM_PROVIDER || 'deepseek';

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

  // Fallback to Ollama
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const instance = new OllamaProvider(ollamaUrl);
  provider = createProviderWithCircuitBreaker('ollama', instance);
  return provider;
}

export function resetAIProvider(): void {
  provider = null;
}
