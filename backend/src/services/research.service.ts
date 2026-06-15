import { prisma } from './db.js';
import { z } from 'zod';

const createResearchSchema = z.object({
  projectId: z.string().min(1),
  query: z.string().min(2).max(500),
});

export async function createResearch(userId: string, input: unknown) {
  const data = createResearchSchema.parse(input);
  const project = await prisma.contentProject.findFirst({ where: { id: data.projectId, userId } });
  if (!project) {
    throw new Error('Project not found');
  }
  const prompt = data.query;
  const summary = `${prompt}\n\n[research placeholder]\n`;
  return prisma.researchReport.create({
    data: { projectId: project.id, competitor: prompt, findings: summary },
  });
}

export async function listResearch(userId: string, projectId?: string) {
  return prisma.researchReport.findMany({
    where: {
      project: { userId, ...(projectId ? { id: projectId } : {}) },
    },
    orderBy: { createdAt: 'desc' },
  });
}
