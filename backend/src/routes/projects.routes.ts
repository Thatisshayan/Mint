import fastify from 'fastify';

export async function projectRoutes(fastify: any) {
  fastify.get('/projects', async () => ({ projects: [] }));

  fastify.post('/projects', async (request: any, reply: any) => {
    const body = request.body as { title?: string; description?: string };
    return {
      id: 'local-' + Date.now(),
      title: body.title || 'Untitled',
      description: body.description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
