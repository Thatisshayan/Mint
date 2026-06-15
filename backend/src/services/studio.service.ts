import { prisma } from './db.js';
import { z } from 'zod';

const generateIdeasSchema = z.object({
  projectId: z.string().min(1),
  brief: z.string().min(10).max(4000),
});

export async function generateIdeas(userId: string, input: unknown) {
  const data = generateIdeasSchema.parse(input);
  const project = await prisma.contentProject.findFirst({ where: { id: data.projectId, userId } });
  if (!project) {
    throw new Error('Project not found');
  }
  const idea = {
    id: crypto.randomUUID(),
    title: `Idea: ${data.brief.slice(0, 32)}`,
    brief: data.brief,
    createdAt: new Date().toISOString(),
  };
  return { projectId: project.id, ideas: [idea] };
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
