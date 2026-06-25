import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface AiUsageEntry {
  timestamp: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  contentType: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

const COST_PER_1K_TOKENS: Record<string, number> = {
  'deepseek-chat': 0.001,
  'deepseek-coder': 0.001,
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.00015,
  'gpt-3.5-turbo': 0.0005,
  'llama3.1:8b': 0,
  'llama3.1:70b': 0,
  'mistral': 0,
  default: 0.001,
};

function estimateCost(provider: string, model: string, totalTokens: number): number {
  const rate = COST_PER_1K_TOKENS[model] ?? COST_PER_1K_TOKENS[provider] ?? COST_PER_1K_TOKENS.default;
  return (totalTokens / 1000) * rate;
}

function getLogPath(): string {
  const dir = join(process.cwd(), 'logs');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, 'ai-usage.jsonl');
}

export function logAiUsage(entry: Omit<AiUsageEntry, 'timestamp' | 'estimatedCost'>) {
  const estimatedCost = estimateCost(entry.provider, entry.model, entry.totalTokens);
  const fullEntry: AiUsageEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    estimatedCost,
  };

  try {
    appendFileSync(getLogPath(), JSON.stringify(fullEntry) + '\n');
  } catch {
    // silently fail if logging fails
  }

  return fullEntry;
}

export function getUsageStats(): {
  today: { count: number; cost: number; tokens: number };
  week: { count: number; cost: number; tokens: number };
  total: { count: number; cost: number; tokens: number };
  byProvider: Record<string, { count: number; cost: number; tokens: number }>;
  byContentType: Record<string, { count: number; cost: number }>;
} {
  const stats = {
    today: { count: 0, cost: 0, tokens: 0 },
    week: { count: 0, cost: 0, tokens: 0 },
    total: { count: 0, cost: 0, tokens: 0 },
    byProvider: {} as Record<string, { count: number; cost: number; tokens: number }>,
    byContentType: {} as Record<string, { count: number; cost: number }>,
  };

  try {
    const logPath = getLogPath();
    if (!existsSync(logPath)) return stats;

    const content = require('fs').readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    for (const line of lines) {
      try {
        const entry: AiUsageEntry = JSON.parse(line);
        const entryDate = new Date(entry.timestamp);

        stats.total.count++;
        stats.total.cost += entry.estimatedCost;
        stats.total.tokens += entry.totalTokens;

        if (entryDate >= todayStart) {
          stats.today.count++;
          stats.today.cost += entry.estimatedCost;
          stats.today.tokens += entry.totalTokens;
        }

        if (entryDate >= weekStart) {
          stats.week.count++;
          stats.week.cost += entry.estimatedCost;
          stats.week.tokens += entry.totalTokens;
        }

        const provider = entry.provider || 'unknown';
        if (!stats.byProvider[provider]) {
          stats.byProvider[provider] = { count: 0, cost: 0, tokens: 0 };
        }
        stats.byProvider[provider].count++;
        stats.byProvider[provider].cost += entry.estimatedCost;
        stats.byProvider[provider].tokens += entry.totalTokens;

        const ct = entry.contentType || 'unknown';
        if (!stats.byContentType[ct]) {
          stats.byContentType[ct] = { count: 0, cost: 0 };
        }
        stats.byContentType[ct].count++;
        stats.byContentType[ct].cost += entry.estimatedCost;
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // no log file yet
  }

  return stats;
}
