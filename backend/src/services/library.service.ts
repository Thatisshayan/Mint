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
