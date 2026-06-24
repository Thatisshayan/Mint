import { prisma } from './db.js';
import { z } from 'zod';

const generateIdeasSchema = z.object({
  projectId: z.string().min(1),
  brief: z.string().min(10).max(4000),
});

export async function generateIdeas(userId: string, input: unknown) {
  const data = generateIdeasSchema.parse(input);
  const project = await prisma.contentProject.findFirst({ where: { id: data.projectId, userId } });
  if (!project) throw new Error('Project not found');

  return {
    projectId: project.id,
    ideas: [
      {
        id: crypto.randomUUID(),
        title: `Idea: ${data.brief.slice(0, 32)}`,
        brief: data.brief,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

const generateImageSchema = z.object({
  prompt: z.string().min(5).max(2000),
});

export async function generateImage(input: unknown) {
  const data = generateImageSchema.parse(input);
  const mediaUrl = process.env.COMFYUI_BASE_URL
    ? `${process.env.COMFYUI_BASE_URL}/view?filename=${encodeURIComponent(data.prompt)}`
    : 'https://placehold.co/1024x1024/000000/FFF?text=No+image+generator+configured';
  return { url: mediaUrl };
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
