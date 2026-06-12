import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as researchService from '../services/research.service.js';

export const researchRoutes = new Router<{ prefix?: string }>();

researchRoutes.post('/research', { preHandler: authMiddleware }, async (request, reply) => {
  const user = (request as any).user;
  const input = request.body as { projectId: string; query: string };
  const report = await researchService.createResearch(user.sub, input);
  return reply.status(201).send(report);
});

researchRoutes.get('/research', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  const projectId = (request.query as any).projectId as string | undefined;
  return researchService.listResearch(user.sub, projectId);
});
