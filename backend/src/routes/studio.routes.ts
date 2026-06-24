import { z } from 'zod';

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long'),
  model: z.string().max(100).optional(),
});

export default async function studioRoutes(fastify: any) {
  fastify.post('/studio/generate', async (request: any, reply: any) => {
    const body = generateSchema.parse(request.body);
    return {
      id: 'local-' + Date.now(),
      content: 'Local generation placeholder. Connect Ollama next.',
      platform: body.model || 'ollama',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
