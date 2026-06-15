import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import {
  createProject,
  listProjects,
  getProject,
} from '../services/project.service.js';
import { z } from 'zod';

type AuthenticatedUser = { sub: string; email?: string };

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    audience: z.string().max(200).optional(),
    goal: z.string().max(200).optional(),
    tone: z.string().max(100).optional(),
    platforms: z.array(z.string()).optional(),
  }),
});

const idZod = z.object({ id: z.string().min(1) });

function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser {
  return (request as unknown as { user: AuthenticatedUser }).user;
}

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/projects',
    { preHandler: authMiddleware },
    async (request: FastifyRequest) => listProjects(getAuthenticatedUser(request).sub),
  );

  fastify.get(
    '/projects/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = idZod.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ message: parsed.error.message });
      }
      const { id } = parsed.data;
      const project = await getProject(getAuthenticatedUser(request).sub, id);
      if (!project) {
        return reply.status(404).send({ message: 'Project not found' });
      }
      return project;
    },
  );

  fastify.post(
    '/projects',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createProjectSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: parsed.error.message });
      }
      return createProject(getAuthenticatedUser(request).sub, parsed.data.body);
    },
  );
}
