import { prisma } from './db.js';

export async function getQueue(userId: string) {
  return prisma.generatedPost.findMany({
    where: {
      userId,
      status: { in: ['pending_review', 'approved'] },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function publishPost(userId: string, id: string) {
  const post = await prisma.generatedPost.findFirst({ where: { id, userId } });
  if (!post) {
    throw new Error('Post not found');
  }
  return prisma.generatedPost.update({
    where: { id },
    data: { status: 'published' },
  });
}
