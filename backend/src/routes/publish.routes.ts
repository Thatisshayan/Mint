import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { getQueue, publishPost } from '../services/publish.service.js';
import { z } from 'zod';

type AuthenticatedUser = { sub: string; email?: string };

const idZod = z.object({ params: z.object({ id: z.string().min(1) }) });

function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser {
  return (request as unknown as { user: AuthenticatedUser }).user;
}

export async function publishRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/publish/queue',
    { preHandler: authMiddleware },
    async (request: FastifyRequest) => getQueue(getAuthenticatedUser(request).sub),
  );

  fastify.post(
    '/publish/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = idZod.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.message });
      }
      return publishPost(getAuthenticatedUser(request).sub, parsed.data.params.id);
    },
  );
}
