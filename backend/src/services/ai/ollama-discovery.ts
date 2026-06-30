import { logger } from '../../lib/logger.js';

const PREFERRED_ORDER = [
  'qwen2.5-coder:7b',
  'qwen2.5:7b',
  'qwen2.5:3b',
  'llama3.1:8b',
  'llama3.2:latest',
  'llama3.2:3b',
  'mistral:latest',
];

export interface OllamaModelInfo {
  name: string;
  size: number;
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
  modified_at?: string;
}

export interface OllamaDiscovery {
  reachable: boolean;
  baseUrl: string;
  models: OllamaModelInfo[];
  selectedModel: string | null;
  error?: string;
}

const state: {
  cache: OllamaDiscovery | null;
  cacheExpiresAt: number;
  userSelected: string | null;
} = {
  cache: null,
  cacheExpiresAt: 0,
  userSelected: null,
};

const CACHE_TTL_MS = 30_000;

const baseUrl = () =>
  (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');

export function setUserSelectedModel(name: string | null): void {
  state.userSelected = name;
  state.cache = null; // invalidate so the next pick returns the new selection
}

export function getUserSelectedModel(): string | null {
  return state.userSelected;
}

export async function discover(reload = false): Promise<OllamaDiscovery> {
  const url = baseUrl();
  if (!reload && state.cache && Date.now() < state.cacheExpiresAt) {
    return state.cache;
  }

  const discovery: OllamaDiscovery = {
    reachable: false,
    baseUrl: url,
    models: [],
    selectedModel: null,
  };

  try {
    const res = await fetch(`${url}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      discovery.error = `Ollama /api/tags returned ${res.status}`;
      state.cache = discovery;
      state.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return discovery;
    }
    const json = (await res.json()) as { models?: OllamaModelInfo[] };
    discovery.models = json.models || [];
    discovery.reachable = true;
    discovery.selectedModel = pickModel(discovery.models, state.userSelected);
  } catch (err) {
    discovery.error = (err as Error).message;
    logger.warn(`Ollama discovery failed: ${discovery.error}`);
  }

  state.cache = discovery;
  state.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return discovery;
}

function pickModel(
  models: OllamaModelInfo[],
  userPick: string | null,
): string | null {
  if (models.length === 0) return null;
  const names = new Set(models.map((m) => m.name));
  if (userPick && names.has(userPick)) return userPick;
  for (const pref of PREFERRED_ORDER) {
    if (names.has(pref)) return pref;
  }
  // Fallback to the smallest model present so cheap machines still work.
  return [...models].sort((a, b) => a.size - b.size)[0].name;
}
