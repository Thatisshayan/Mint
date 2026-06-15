import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { listPosts, updatePost } from '../services/library.service.js';
import { z } from 'zod';

type AuthenticatedUser = { sub: string; email?: string };

const updatePostSchema = z.object({
  body: z.object({ status: z.string().optional() }),
});

const idZod = z.object({ params: z.object({ id: z.string().min(1) }) });

function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser {
  return (request as unknown as { user: AuthenticatedUser }).user;
}

export async function libraryRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/library/posts',
    { preHandler: authMiddleware },
    async (request: FastifyRequest) => listPosts(getAuthenticatedUser(request).sub),
  );

  fastify.patch(
    '/library/posts/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = idZod.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ message: parsed.error.message });
      }
      const { id } = parsed.data.params;
      const bodyParsed = updatePostSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send({ message: bodyParsed.error.message });
      }
      return updatePost(getAuthenticatedUser(request).sub, id, bodyParsed.data.body);
    },
  );
}
