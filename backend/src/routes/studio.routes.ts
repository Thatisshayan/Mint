import fastify from 'fastify';
import { z } from 'zod';
import { generateWithOllama } from '../services/studio.service.js';

export async function studioRoutes(fastify: any) {
  fastify.post('/studio/generate', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    const body = request.body as { prompt?: string; model?: string };
    const data = z.object({ prompt: z.string().min(1), model: z.string().optional() }).parse(body ?? {});
    const result = await generateWithOllama({ prompt: data.prompt, model: data.model });
    return {
      id: 'local-' + Date.now(),
      userId: user.sub,
      content: result.output,
      platform: result.model,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
