import fastify from 'fastify';

export async function publishRoutes(fastify: any) {
  fastify.post('/publish', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    const body = request.body as { postId?: string; platform?: string };
    return {
      success: true,
      postId: body.postId || 'local-' + Date.now(),
      platform: body.platform || 'generic',
      status: 'queued',
    };
  });
}
