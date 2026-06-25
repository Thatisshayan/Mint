import { prisma } from './db.js';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  topic: z.string().min(1),
  type: z.string(),
  tone: z.string(),
  prompt: z.string(),
});

export async function listTemplates(userId: string) {
  return prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTemplate(userId: string, id: string) {
  return prisma.template.findFirst({
    where: { id, userId },
  });
}

export async function createTemplate(userId: string, input: unknown) {
  const data = createTemplateSchema.parse(input);
  return prisma.template.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function deleteTemplate(userId: string, id: string) {
  const template = await prisma.template.findFirst({ where: { id, userId } });
  if (!template) {
    throw new Error('Template not found');
  }
  return prisma.template.delete({ where: { id } });
}
