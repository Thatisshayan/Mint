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
}
