import { prisma } from './db.js';
import { z } from 'zod';

const updatePostSchema = z.object({
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

export async function listPosts(userId: string, projectId?: string, page = 1, perPage = 20) {
  const skip = (page - 1) * perPage;
  const [items, total] = await Promise.all([
    prisma.generatedPost.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.generatedPost.count({
      where: {
        userId,
        ...(projectId ? { projectId } : {}),
      },
    }),
  ]);
  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function searchPosts(userId: string, query: string, page = 1, perPage = 20) {
  if (!query.trim()) {
    return listPosts(userId, undefined, page, perPage);
  }

  const skip = (page - 1) * perPage;
  const lowerQuery = query.toLowerCase();
  const [items, total] = await Promise.all([
    prisma.generatedPost.findMany({
      where: {
        userId,
        OR: [
          { content: { contains: lowerQuery, mode: 'insensitive' } },
          { platform: { contains: lowerQuery, mode: 'insensitive' } },
          { tags: { hasSome: [lowerQuery] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.generatedPost.count({
      where: {
        userId,
        OR: [
          { content: { contains: lowerQuery, mode: 'insensitive' } },
          { platform: { contains: lowerQuery, mode: 'insensitive' } },
          { tags: { hasSome: [lowerQuery] } },
        ],
      },
    }),
  ]);
  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
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

export async function toggleFavorite(userId: string, id: string) {
  const post = await prisma.generatedPost.findFirst({ where: { id, userId } });
  if (!post) {
    throw new Error('Post not found');
  }
  return prisma.generatedPost.update({
    where: { id },
    data: { isFavorite: !post.isFavorite },
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
    tags: z.array(z.string()).optional(),
  }).parse(input);

  return prisma.generatedPost.create({
    data: {
      content: data.content,
      platform: data.platform,
      status: data.status,
      tags: data.tags || [],
      projectId: data.projectId || null,
      userId,
    },
  });
}
