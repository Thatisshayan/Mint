import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as studioService from '../services/studio.service.js';
import { z } from 'zod';

const generateIdeasSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    brief: z.string().min(1).max(5000),
  }),
});

const generateImageSchema = z.object({
  body: z.object({
    prompt: z.string().min(1).max(2000),
  }),
});

export const studioRoutes = new Router<{ prefix?: string }>();

studioRoutes.post('/studio/generate', { preHandler: authMiddleware }, async (request, reply) => {
  const parsed = generateIdeasSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: parsed.error.message });
  }
  const user = (request as any).user;
  return reply.status(201).send(await studioService.generateIdeas(user.sub, parsed.data.body));
});

studioRoutes.post('/studio/generate-image', { preHandler: authMiddleware }, async (request, reply) => {
  const parsed = generateImageSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: parsed.error.message });
  }
  return studioService.generateImage(parsed.data.body.prompt);
});
