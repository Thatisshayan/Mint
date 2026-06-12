import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as libraryService from '../services/library.service.js';

export const libraryRoutes = new Router<{ prefix?: string }>();

libraryRoutes.get('/library/posts', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  const projectId = (request.query as any).projectId as string | undefined;
  return libraryService.listPosts(user.sub, projectId);
});

libraryRoutes.patch('/library/posts/:id', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  const id = (request.params as any).id as string;
  const body = request.body as { status?: string };
  return libraryService.updatePost(user.sub, id, body);
});
