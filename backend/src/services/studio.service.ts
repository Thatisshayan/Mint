import { prisma } from '../services/db.js';

export async function generateIdeas(userId: string, input: { projectId: string; brief: string }) {
  const project = await prisma.contentProject.findFirst({ where: { id: input.projectId, userId } });
  if (!project) throw new Error('Project not found');
  const ideas = Array.from({ length: 5 }).map((_, idx) => ({
    id: crypto.randomUUID(),
    title: `Idea ${idx + 1}`,
    brief: input.brief,
    createdAt: new Date().toISOString(),
  }));
  return { projectId: project.id, ideas };
}

export async function generateImage(prompt: string) {
  const mediaUrl = process.env.COMFYUI_BASE_URL
    ? `${process.env.COMFYUI_BASE_URL}/view?filename=${encodeURIComponent(prompt)}`
    : 'https://placehold.co/1024x1024/000000/FFF?text=No+image+generator+configured';
  return { url: mediaUrl };
}
