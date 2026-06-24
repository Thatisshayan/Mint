import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

const publishSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'generic']),
});

export default async function publishRoutes(fastify: any) {
  fastify.get('/publish', { preHandler: authMiddleware }, async (request: any) => {
    const { getQueue } = await import('../services/publish.service.js');
    const userId = request.user?.sub || request.user?.email;
    return { queue: await getQueue(userId) };
  });

  fastify.post('/publish', { preHandler: authMiddleware }, async (request: any) => {
    const body = publishSchema.parse(request.body);
    const { publishPost } = await import('../services/publish.service.js');
    const userId = request.user?.sub || request.user?.email;
    return await publishPost(userId, body.postId);
  });

  fastify.get('/publish/:id', { preHandler: authMiddleware }, async (request: any) => {
    const { id } = request.params as { id: string };
    const { getPublishItem } = await import('../services/publish.service.js');
    const userId = request.user?.sub || request.user?.email;
    const item = await getPublishItem(userId, id);
    if (!item) {
      throw new Error('Post not found');
    }
    return item;
  });

  fastify.delete('/publish/:id', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const { deleteFromQueue } = await import('../services/publish.service.js');
    const userId = request.user?.sub || request.user?.email;
    await deleteFromQueue(userId, id);
    reply.status(204);
    return { success: true };
  });
}
