import { prisma } from '../services/db.js';

export async function createResearch(userId: string, input: { projectId: string; query: string }) {
  const { projectId, query } = input;
  const project = await prisma.contentProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error('Project not found');
  const report = await prisma.researchReport.create({
    data: { projectId, competitor: query, findings: `Research for: ${query}` },
  });
  return report;
}

export async function listResearch(userId: string, projectId?: string) {
  return prisma.researchReport.findMany({
    where: {
      project: { userId, ...(projectId ? { id: projectId } : {}) },
    },
    orderBy: { createdAt: 'desc' },
  });
}
