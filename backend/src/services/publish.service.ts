import { prisma } from './db.js';

export async function getQueue(userId: string) {
  return prisma.generatedPost.findMany({
    where: {
      project: { userId },
      status: { in: ['pending_review', 'approved'] },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function publishPost(userId: string, id: string) {
  const post = await prisma.generatedPost.findFirst({ where: { id, project: { userId } } });
  if (!post) {
    throw new Error('Post not found');
  }
  return prisma.generatedPost.update({
    where: { id },
    data: { status: 'published', publishedAt: new Date() },
  });
}
