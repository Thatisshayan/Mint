import { prisma } from './db.js';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function createProject(userId: string, input: unknown) {
  const data = createProjectSchema.parse(input);
  return prisma.contentProject.create({
    data: { title: data.title, description: data.description ?? null, status: 'draft', userId },
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
  });
}

export async function updateProject(userId: string, id: string, input: unknown) {
  const data = createProjectSchema.partial().parse(input);
  const project = await prisma.contentProject.findFirst({ where: { id, userId } });
  if (!project) {
    throw new Error('Project not found');
  }
  return prisma.contentProject.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      updatedAt: new Date(),
    },
  });
}

export async function deleteProject(userId: string, id: string) {
  const project = await prisma.contentProject.findFirst({ where: { id, userId } });
  if (!project) {
    throw new Error('Project not found');
  }
  return prisma.contentProject.delete({ where: { id } });
}
