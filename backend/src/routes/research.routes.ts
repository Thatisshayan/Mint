import { z } from 'zod';

const createResearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000, 'Query too long'),
  source: z.string().max(100, 'Source too long').optional(),
});

export default async function researchRoutes(fastify: any) {
  fastify.get('/research', async () => ({ reports: [] }));

  fastify.post('/research', async (request: any, reply: any) => {
    const body = createResearchSchema.parse(request.body);
    return {
      id: 'local-' + Date.now(),
      query: body.query,
      source: body.source || 'local',
      summary: 'Local research stub',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
