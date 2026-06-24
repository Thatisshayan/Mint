import { prisma } from './db.js';
import { z } from 'zod';

const createResearchSchema = z.object({
  projectId: z.string().optional(),
  query: z.string().min(2).max(2000),
  summary: z.string().optional(),
});

export async function createResearch(userId: string, input: unknown) {
  const data = createResearchSchema.parse(input);
  let projectId = data.projectId || null;

  if (data.projectId) {
    const project = await prisma.contentProject.findFirst({ where: { id: data.projectId, userId } });
    if (!project) {
      throw new Error('Project not found');
    }
    projectId = project.id;
  }

  return prisma.researchReport.create({
    data: {
      projectId,
      query: data.query,
      source: 'ai',
      summary: data.summary || `${data.query}\n\n[research placeholder]`,
      userId,
    },
  });
}

export async function listResearch(userId: string, projectId?: string) {
  return prisma.researchReport.findMany({
    where: {
      userId,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getResearch(userId: string, id: string) {
  return prisma.researchReport.findFirst({
    where: { id, userId },
  });
}

export async function deleteResearch(userId: string, id: string) {
  const report = await prisma.researchReport.findFirst({ where: { id, userId } });
  if (!report) {
    throw new Error('Research report not found');
  }
  return prisma.researchReport.delete({ where: { id } });
}
