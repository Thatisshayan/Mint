import fastify from 'fastify';

export default async function researchRoutes(fastify: any) {
  fastify.get('/research', async () => ({ reports: [] }));

  fastify.post('/research', async (request: any, reply: any) => {
    const body = request.body as { query?: string; source?: string };
    return {
      id: 'local-' + Date.now(),
      query: body.query || '',
      source: body.source || 'local',
      summary: 'Local research stub',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
