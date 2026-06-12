import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as researchService from '../services/research.service.js';
import { z } from 'zod';

const createResearchSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    query: z.string().min(1).max(500),
  }),
});

export const researchRoutes = new Router<{ prefix?: string }>();

researchRoutes.get('/research', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  const projectId = (request.query as any).projectId as string | undefined;
  return researchService.listResearch(user.sub, projectId);
});

researchRoutes.post('/research', { preHandler: authMiddleware }, async (request, reply) => {
  const parsed = createResearchSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: parsed.error.message });
  }
  const user = (request as any).user;
  return reply.status(201).send(await researchService.createResearch(user.sub, parsed.data.body));
});
