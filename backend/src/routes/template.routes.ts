import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';

export default async function templateRoutes(fastify: FastifyInstance) {
  fastify.get('/templates', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const { listTemplates } = await import('../services/template.service.js');
    const userId = request.user?.sub || request.user?.email;
    return { items: await listTemplates(userId) };
  });

  const createTemplateSchema = z.object({
    name: z.string().min(1),
    topic: z.string().min(1),
    type: z.string(),
    tone: z.string(),
    prompt: z.string(),
  });

  fastify.post('/templates', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = createTemplateSchema.parse(request.body);
    const { createTemplate } = await import('../services/template.service.js');
    const userId = request.user?.sub || request.user?.email;
    return await createTemplate(userId, body);
  });

  fastify.get('/templates/:id', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { getTemplate } = await import('../services/template.service.js');
    const userId = request.user?.sub || request.user?.email;
    const template = await getTemplate(userId, id);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  });

  fastify.delete('/templates/:id', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { deleteTemplate } = await import('../services/template.service.js');
    const userId = request.user?.sub || request.user?.email;
    await deleteTemplate(userId, id);
    reply.status(204);
    return { success: true };
  });
}