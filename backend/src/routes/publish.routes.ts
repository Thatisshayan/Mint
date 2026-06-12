import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as publishService from '../services/publish.service.js';

export const publishRoutes = new Router<{ prefix?: string }>();

publishRoutes.get('/publish/queue', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  return publishService.getQueue(user.sub);
});

publishRoutes.post('/publish/publish/:id', { preHandler: authMiddleware }, async (request, reply) => {
  const user = (request as any).user;
  const id = (request.params as any).id as string;
  const result = await publishService.publishPost(user.sub, id);
  return reply.send(result);
});
