import { prisma } from '../services/db.js';

export async function listPosts(userId: string, projectId?: string) {
  return prisma.generatedPost.findMany({
    where: {
      project: { userId, ...(projectId ? { id: projectId } : {}) },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePost(userId: string, id: string, updates: { status?: string }) {
  const post = await prisma.generatedPost.findFirst({
    where: { id, project: { userId } },
  });
  if (!post) throw new Error('Post not found');
  return prisma.generatedPost.update({
    where: { id },
    data: updates,
  });
}
