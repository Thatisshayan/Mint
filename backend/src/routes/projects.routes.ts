import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as projectService from '../services/project.service.js';
import { z } from 'zod';

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    audience: z.string().max(200).optional(),
    goal: z.string().max(2000).optional(),
    tone: z.string().max(100).optional(),
    platforms: z.array(z.string()).optional(),
  }),
});

export const projectRoutes = new Router<{ prefix?: string }>();

projectRoutes.get('/', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  return projectService.listProjects(user.sub);
});

projectRoutes.get('/:id', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  const id = (request.params as { id: string }).id;
  return projectService.getProject(user.sub, id);
});

projectRoutes.post('/', { preHandler: authMiddleware }, async (request, reply) => {
  const parsed = createProjectSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: parsed.error.message });
  }
  const user = (request as any).user;
  return reply.status(201).send(await projectService.createProject(user.sub, parsed.data.body));
});
