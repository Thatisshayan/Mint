import fastify from 'fastify';

export async function projectRoutes(fastify: any) {
  fastify.get('/projects', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    return { projects: [] };
  });

  fastify.post('/projects', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    const body = request.body as { title?: string; description?: string };
    return {
      id: 'local-' + Date.now(),
      userId: user.sub,
      title: body.title || 'Untitled',
      description: body.description || null,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
