import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';

export default async function exportRoutes(fastify: FastifyInstance) {
  fastify.get('/export/all', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const userId = request.user?.sub || request.user?.email;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const [projects, posts, reports, templates] = await Promise.all([
      prisma.contentProject.findMany({ where: { userId } }),
      prisma.generatedPost.findMany({ where: { userId } }),
      prisma.researchReport.findMany({ where: { userId } }),
      prisma.template.findMany({ where: { userId } }),
    ]);

    await prisma.$disconnect();

    return {
      exportedAt: new Date().toISOString(),
      userId,
      data: {
        projects,
        posts,
        reports,
        templates,
      },
    };
  });

  fastify.post('/export/restore', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.sub || request.user?.email;
    const body = restoreSchema.parse(request.body);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const restored = { projects: 0, posts: 0, reports: 0, templates: 0 };

    if (body.data.projects) {
      for (const project of body.data.projects) {
        const { id, createdAt, updatedAt, ...data } = project;
        await prisma.contentProject.upsert({
          where: { id },
          create: { ...data, userId, id },
          update: data,
        });
        restored.projects++;
      }
    }

    if (body.data.posts) {
      for (const post of body.data.posts) {
        const { id, createdAt, updatedAt, ...data } = post;
        await prisma.generatedPost.upsert({
          where: { id },
          create: { ...data, userId, id },
          update: data,
        });
        restored.posts++;
      }
    }

    if (body.data.reports) {
      for (const report of body.data.reports) {
        const { id, createdAt, updatedAt, ...data } = report;
        await prisma.researchReport.upsert({
          where: { id },
          create: { ...data, userId, id },
          update: data,
        });
        restored.reports++;
      }
    }

    if (body.data.templates) {
      for (const template of body.data.templates) {
        const { id, createdAt, updatedAt, ...data } = template;
        await prisma.template.upsert({
          where: { id },
          create: { ...data, userId, id },
          update: data,
        });
        restored.templates++;
      }
    }

    await prisma.$disconnect();

    return { success: true, restored };
  });
}

const restoreSchema = z.object({
  data: z.object({
    projects: z.array(z.any()).optional(),
    posts: z.array(z.any()).optional(),
    reports: z.array(z.any()).optional(),
    templates: z.array(z.any()).optional(),
  }),
});