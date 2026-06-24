import { z } from 'zod';

const publishSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'generic']),
});

export default async function publishRoutes(fastify: any) {
  fastify.post('/publish', async (request: any, reply: any) => {
    const body = publishSchema.parse(request.body);
    return {
      success: true,
      postId: body.postId,
      platform: body.platform,
      status: 'queued',
      queuedAt: new Date().toISOString(),
    };
  });
}
