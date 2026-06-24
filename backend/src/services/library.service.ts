import { prisma } from './db.js';
import { z } from 'zod';

const updatePostSchema = z.object({
  status: z.string().optional().default('draft'),
});

export async function listPosts(userId: string, projectId?: string) {
  return prisma.generatedPost.findMany({
    where: {
      userId,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePost(userId: string, id: string, updates: unknown) {
  const data = updatePostSchema.parse(updates ?? {});
  const post = await prisma.generatedPost.findFirst({ where: { id, userId } });
  if (!post) {
    throw new Error('Post not found');
  }
  return prisma.generatedPost.update({
    where: { id },
    data,
  });
}

export async function getPost(userId: string, id: string) {
  return prisma.generatedPost.findFirst({
    where: { id, userId },
  });
}

export async function deletePost(userId: string, id: string) {
  const post = await prisma.generatedPost.findFirst({ where: { id, userId } });
  if (!post) {
    throw new Error('Post not found');
  }
  return prisma.generatedPost.delete({ where: { id } });
}

export async function createPost(userId: string, input: unknown) {
  const data = z.object({
    content: z.string().min(1),
    platform: z.string().optional().default('generic'),
    status: z.string().optional().default('draft'),
    projectId: z.string().optional(),
  }).parse(input);

  return prisma.generatedPost.create({
    data: {
      content: data.content,
      platform: data.platform,
      status: data.status,
      projectId: data.projectId || null,
      userId,
    },
  });
}
