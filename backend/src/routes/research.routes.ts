import fastify from 'fastify';

export async function researchRoutes(fastify: any) {
  fastify.get('/research', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    return { reports: [] };
  });

  fastify.post('/research', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    const body = request.body as { query?: string; source?: string };
    return {
      id: 'local-' + Date.now(),
      userId: user.sub,
      query: body.query || '',
      source: body.source || 'brave',
      summary: 'Research stub',
      createdAt: new Date().toISOString(),
    };
  });
}
