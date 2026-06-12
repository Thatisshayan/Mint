import { Router } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';

export const authRoutes = new Router<{ prefix?: string }>();

authRoutes.post('/magic-link', async (request, reply) => {
  const { email } = request.body as { email: string };
  await authService.sendMagicLink(email);
  return reply.send({ message: 'If that account exists, a magic link has been sent.' });
});

authRoutes.post('/verify', async (request, reply) => {
  const { token } = request.body as { token: string };
  const result = await authService.verifyMagicLink(token);
  return reply.send(result);
});

authRoutes.get('/me', { preHandler: authMiddleware }, async (request) => {
  const user = (request as any).user;
  return { user: { id: user.sub, email: user.email } };
});

authRoutes.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
  // Stateless JWT logout: client removes token
  return reply.send({ message: 'Logged out' });
});
