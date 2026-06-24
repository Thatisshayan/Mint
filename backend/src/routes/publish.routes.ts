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
}
