import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as studioService from '../services/studio.service.js';

export const studioRoutes = new Router<{ prefix?: string }>();

studioRoutes.post('/studio/generate', { preHandler: authMiddleware }, async (request, reply) => {
  const user = (request as any).user;
  const input = request.body as { projectId: string; brief: string };
  const result = await studioService.generateIdeas(user.sub, input);
  return reply.status(201).send(result);
});

studioRoutes.post('/studio/generate-image', { preHandler: authMiddleware }, async (request, reply) => {
  const user = (request as any).user;
  const input = request.body as { prompt: string };
  const image = await studioService.generateImage(input.prompt);
  return reply.send(image);
});
