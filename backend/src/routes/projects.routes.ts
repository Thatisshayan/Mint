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
}
