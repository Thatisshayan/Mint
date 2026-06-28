import { prisma } from './db.js';
import { z } from 'zod';

const updatePostSchema = z.object({
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

function serializeTags(tags: string[] | undefined): string {
  return JSON.stringify(tags || []);
}

function deserializeTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  return {
    items: items.map((item) => ({ ...item, tags: deserializeTags(item.tags) })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
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
          { content: { contains: lowerQuery } },
          { platform: { contains: lowerQuery } },
          { tags: { contains: lowerQuery } },
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
          { content: { contains: lowerQuery } },
          { platform: { contains: lowerQuery } },
          { tags: { contains: lowerQuery } },
        ],
      },
    }),
  ]);
  return {
    items: items.map((item) => ({ ...item, tags: deserializeTags(item.tags) })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function updatePost(userId: string, id: string, updates: unknown) {
  const data = updatePostSchema.parse(updates ?? {});
  const post = await prisma.generatedPost.findFirst({ where: { id, userId } });
  if (!post) {
    throw new Error('Post not found');
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.tags !== undefined) {
    updateData.tags = serializeTags(data.tags);
  }

  const updated = await prisma.generatedPost.update({
    where: { id },
    data: updateData,
  });
  return { ...updated, tags: deserializeTags(updated.tags) };
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
  const post = await prisma.generatedPost.findFirst({
    where: { id, userId },
  });
  if (!post) return null;
  return { ...post, tags: deserializeTags(post.tags) };
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

  const created = await prisma.generatedPost.create({
    data: {
      content: data.content,
      platform: data.platform,
      status: data.status,
      tags: serializeTags(data.tags),
      projectId: data.projectId || null,
      userId,
    },
  });
  return { ...created, tags: deserializeTags(created.tags) };
}
