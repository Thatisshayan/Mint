import { prisma } from './db.js';
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  audience: z.string().max(200).optional(),
  goal: z.string().max(200).optional(),
  tone: z.string().max(100).optional(),
  platforms: z.array(z.string()).optional(),
});

export async function createProject(userId: string, input: unknown) {
  const data = createProjectSchema.parse(input);
  return prisma.contentProject.create({
    data: { ...data, userId },
  });
}

export async function listProjects(userId: string) {
  return prisma.contentProject.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProject(userId: string, id: string) {
  return prisma.contentProject.findFirst({
    where: { id, userId },
    include: { posts: true, reports: true },
  });
}
