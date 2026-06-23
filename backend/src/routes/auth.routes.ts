import fastify from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { getCurrentUser } from '../services/auth.service.js';

export default async function authRoutes(fastify: any) {
  fastify.post('/auth/magic-link', async (request: any, reply: any) => {
    const body = request.body as { email: string };
    return { sent: true, email: body.email };
  });

  fastify.post('/auth/verify', async (request: any, reply: any) => {
    const body = request.body as { token: string; email: string };
    return { accessToken: 'local-dev', refreshToken: 'local-refresh', user: { email: body.email } };
  });

  fastify.post('/auth/refresh', async (request: any, reply: any) => {
    return { accessToken: 'local-dev' };
  });

  fastify.post('/auth/logout', { preHandler: authMiddleware }, async () => ({ ok: true }));

  fastify.get('/auth/me', { preHandler: authMiddleware }, async (request: any) => {
    return { user: getCurrentUser(request) };
  });
}
