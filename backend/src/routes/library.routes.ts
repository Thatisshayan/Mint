import { z } from 'zod';

export default async function libraryRoutes(fastify: any) {
  fastify.get('/library', async () => ({ items: [] }));

  const updateItemSchema = z.object({
    id: z.string().min(1, 'Item ID is required'),
    status: z.enum(['draft', 'published', 'archived']),
  });

  fastify.patch('/library/:id', async (request: any, reply: any) => {
    const body = updateItemSchema.parse(request.body);
    return {
      id: body.id,
      status: body.status,
      updatedAt: new Date().toISOString(),
    };
  });
}
