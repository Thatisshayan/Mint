import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as libraryService from '../services/library.service.js';
import { z } from 'zod';

const updatePostSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'queued', 'pending_review', 'approved', 'published']).optional(),
  }),
});

export const libraryRoutes = new Router<{ prefix?: string }>();

libraryRoutes.get('/library/posts', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  const projectId = (request.query as any).projectId as string | undefined;
  return libraryService.listPosts(user.sub, projectId);
});

libraryRoutes.patch('/library/posts/:id', { preHandler: authMiddleware }, async (request, reply) => {
  const parsed = updatePostSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: parsed.error.message });
  }
  const user = (request as any).user;
  const id = (request.params as { id: string }).id;
  return libraryService.updatePost(user.sub, id, parsed.data.body);
});
