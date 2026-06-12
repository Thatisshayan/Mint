import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as projectService from '../services/project.service.js';

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
  const user = (request as any).user;
  const project = await projectService.createProject(user.sub, request.body);
  return reply.status(201).send(project);
});
