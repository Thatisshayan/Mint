import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
});

export default async function projectRoutes(fastify: any) {
  fastify.get('/projects', { preHandler: authMiddleware }, async (request: any) => {
    const { listProjects } = await import('../services/project.service.js');
    const userId = request.user?.sub || request.user?.email;
    return { projects: await listProjects(userId) };
  });

  fastify.post('/projects', { preHandler: authMiddleware }, async (request: any) => {
    const body = createProjectSchema.parse(request.body);
    const { createProject } = await import('../services/project.service.js');
    const userId = request.user?.sub || request.user?.email;
    return await createProject(userId, body);
  });

  const updateProjectSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
  });

  fastify.get('/projects/:id', { preHandler: authMiddleware }, async (request: any) => {
    const { id } = request.params as { id: string };
    const { getProject } = await import('../services/project.service.js');
    const userId = request.user?.sub || request.user?.email;
    const project = await getProject(userId, id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  });

  fastify.patch('/projects/:id', { preHandler: authMiddleware }, async (request: any) => {
    const { id } = request.params as { id: string };
    const body = updateProjectSchema.parse(request.body);
    const { updateProject } = await import('../services/project.service.js');
    const userId = request.user?.sub || request.user?.email;
    return await updateProject(userId, id, body);
  });

  fastify.delete('/projects/:id', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const { deleteProject } = await import('../services/project.service.js');
    const userId = request.user?.sub || request.user?.email;
    await deleteProject(userId, id);
    reply.status(204);
    return { success: true };
  });
}
