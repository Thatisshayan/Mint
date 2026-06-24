import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

export default async function libraryRoutes(fastify: any) {
  fastify.get('/library', { preHandler: authMiddleware }, async (request: any) => {
    const { listPosts } = await import('../services/library.service.js');
    const userId = request.user?.sub || request.user?.email;
    return { items: await listPosts(userId) };
  });

  const updateItemSchema = z.object({
    status: z.enum(['draft', 'published', 'archived']),
  });

  fastify.patch('/library/:id', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const body = updateItemSchema.parse(request.body);
    const { updatePost } = await import('../services/library.service.js');
    const userId = request.user?.sub || request.user?.email;
    return await updatePost(userId, id, body);
  });

  const createPostSchema = z.object({
    content: z.string().min(1, 'Content is required'),
    platform: z.string().optional().default('generic'),
    status: z.string().optional().default('draft'),
    projectId: z.string().optional(),
  });

  fastify.post('/library', { preHandler: authMiddleware }, async (request: any) => {
    const body = createPostSchema.parse(request.body);
    const { createPost } = await import('../services/library.service.js');
    const userId = request.user?.sub || request.user?.email;
    return await createPost(userId, body);
  });

  fastify.get('/library/:id', { preHandler: authMiddleware }, async (request: any) => {
    const { id } = request.params as { id: string };
    const { getPost } = await import('../services/library.service.js');
    const userId = request.user?.sub || request.user?.email;
    const post = await getPost(userId, id);
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  });

  fastify.delete('/library/:id', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const { deletePost } = await import('../services/library.service.js');
    const userId = request.user?.sub || request.user?.email;
    await deletePost(userId, id);
    reply.status(204);
    return { success: true };
  });
}
