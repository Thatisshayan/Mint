import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
});

export default async function projectRoutes(fastify: any) {
  fastify.get('/projects', async () => ({ projects: [] }));

  fastify.post('/projects', async (request: any, reply: any) => {
    const body = createProjectSchema.parse(request.body);
    return {
      id: 'local-' + Date.now(),
      title: body.title,
      description: body.description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
