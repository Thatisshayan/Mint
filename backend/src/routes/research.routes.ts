import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { listResearch, createResearch } from '../services/research.service.js';
import { z } from 'zod';

type AuthenticatedUser = { sub: string; email?: string };

const createResearchSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    query: z.string().min(2).max(500),
  }),
});

function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser {
  return (request as unknown as { user: AuthenticatedUser }).user;
}

export async function researchRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/research',
    { preHandler: authMiddleware },
    async (request: FastifyRequest) => listResearch(getAuthenticatedUser(request).sub),
  );

  fastify.post(
    '/research',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createResearchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: parsed.error.message });
      }
      return createResearch(getAuthenticatedUser(request).sub, parsed.data.body);
    },
  );
}
