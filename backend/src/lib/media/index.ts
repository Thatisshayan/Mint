import { ComfyUIProvider } from './comfyui.js';
import type { Provider } from './types.js';

export interface MediaProviderConfig {
  type: 'comfyui' | 'openai' | 'stability' | 'dashscope';
  comfyui?: { baseUrl: string };
  ai?: { apiKey?: string; model?: string };
}

export function createMediaProvider(config: MediaProviderConfig): Provider {
  switch (config.type) {
    case 'comfyui':
      if (!config.comfyui?.baseUrl) throw new Error('Missing COMFYUI_BASE_URL');
      return new ComfyUIProvider(config.comfyui.baseUrl);
    default:
      throw new Error(`Unsupported media provider: ${(config as any).type}`);
  }
}
