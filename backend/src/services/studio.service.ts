import { prisma } from './db.js';
import { z } from 'zod';
import { getAIProvider } from './ai/index.js';

const generateIdeasSchema = z.object({
  projectId: z.string().min(1),
  brief: z.string().min(10).max(4000),
  tone: z.enum(['professional', 'casual', 'educational', 'entertaining']).optional(),
  count: z.number().min(1).max(10).optional(),
});

export async function generateIdeas(userId: string, input: unknown) {
  const data = generateIdeasSchema.parse(input);
  const project = await prisma.contentProject.findFirst({ where: { id: data.projectId, userId } });
  if (!project) throw new Error('Project not found');

  const provider = getAIProvider();
  const tone = data.tone || 'educational';
  const count = data.count || 5;

  const prompt = [
    `You are a creative content strategist for a faceless YouTube channel.`,
    `Project: "${project.title}"`,
    `Brief: "${data.brief}"`,
    `Tone: ${tone}.`,
    `Generate exactly ${count} content ideas.`,
    `Each idea should have a catchy title and a one-sentence brief.`,
    `Format: Number each idea. Title: ... | Brief: ...`,
    `No AI self-reference. Be specific and actionable.`,
  ].join('\n');

  const result = await provider.generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 2048,
  });

  const ideas = result.output
    .split('\n')
    .filter((line: string) => line.trim().length > 0)
    .map((line: string, idx: number) => {
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      const titleMatch = cleaned.match(/Title:\s*(.+?)(?:\s*\||$)/i);
      const briefMatch = cleaned.match(/Brief:\s*(.+)/i);
      return {
        id: crypto.randomUUID(),
        title: titleMatch?.[1]?.trim() || `Idea ${idx + 1}`,
        brief: briefMatch?.[1]?.trim() || cleaned,
        createdAt: new Date().toISOString(),
      };
    });

  return {
    projectId: project.id,
    model: result.model,
    provider: result.provider,
    ideas,
  };
}

const generateImageSchema = z.object({
  prompt: z.string().min(5).max(2000),
  workflow: z.record(z.unknown()).optional(),
});

export async function generateImage(input: unknown) {
  const data = generateImageSchema.parse(input);

  if (!process.env.COMFYUI_BASE_URL) {
    return {
      url: 'https://placehold.co/1024x1024/000000/FFF?text=ComfyUI+not+configured',
      provider: 'placeholder',
      message: 'COMFYUI_BASE_URL is not configured. Set it in your .env to enable image generation.',
    };
  }

  const { generateComfyUIImage } = await import('./ai/comfyui.service.js');
  const result = await generateComfyUIImage({
    prompt: data.prompt,
    workflow: data.workflow,
    filename: `mint-${Date.now()}`,
  });

  return {
    url: result.url,
    provider: result.provider,
    promptId: result.promptId,
  };
}

const ollamaChatSchema = z.object({
  model: z.string().default('llama3.1:8b'),
  prompt: z.string().min(1).max(12000),
  system: z.string().max(4000).optional(),
  format: z.string().optional(),
  stream: z.boolean().optional(),
});

export async function generateWithOllama(input: { prompt: string; system?: string; model?: string; stream?: boolean }) {
  const data = ollamaChatSchema.parse(input);
  const base = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: data.model,
        prompt: data.prompt,
        system: data.system,
        format: data.format ?? undefined,
        stream: data.stream ?? false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const details = await res.text().catch(() => '');
      throw new Error(`Ollama generation failed (${res.status}): ${details || res.statusText}`);
    }

    const text = await res.text();
    if (!text) throw new Error('Ollama generation returned empty response');

    try {
      const json = JSON.parse(text) as { done?: boolean; response?: string };
      return { output: json.response ?? '', model: data.model, done: json.done ?? true };
    } catch {
      return { output: text, model: data.model, done: true };
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') throw new Error(`Ollama generation aborted after 30s`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
