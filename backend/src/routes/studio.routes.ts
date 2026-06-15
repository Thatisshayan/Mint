import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { generateIdeas, generateImage } from '../services/studio.service.js';
import { z } from 'zod';

type AuthenticatedUser = { sub: string; email?: string };

const generateIdeasSchema = z.object({
  body: z.object({ projectId: z.string().min(1), brief: z.string().min(10).max(4000) }),
});

const generateImageSchema = z.object({ body: z.object({ prompt: z.string().min(5).max(2000) }) });

function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser {
  return (request as unknown as { user: AuthenticatedUser }).user;
}

export async function studioRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/studio/generate',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = generateIdeasSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: parsed.error.message });
      }
      return generateIdeas(getAuthenticatedUser(request).sub, parsed.data.body);
    },
  );

  fastify.post(
    '/studio/generate-image',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = generateImageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: parsed.error.message });
      }
      return generateImage(parsed.data.body);
    },
  );
}
