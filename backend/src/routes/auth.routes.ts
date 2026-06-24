import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { getCurrentUser } from '../services/auth.service.js';
import { sign } from '../utils/jwt.js';

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email format'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export default async function authRoutes(fastify: any) {
  // Rate limit: 5 requests per minute per IP for auth endpoints
  fastify.post('/auth/magic-link', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request: any, reply: any) => {
    const body = magicLinkSchema.parse(request.body);
    return { sent: true, email: body.email };
  });

  fastify.post('/auth/verify', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request: any, reply: any) => {
    const body = verifySchema.parse(request.body);
    const accessToken = sign({ sub: body.email, email: body.email }, { expiresIn: '24h' });
    const refreshToken = sign({ sub: body.email, type: 'refresh' }, { expiresIn: '7d' });
    return { accessToken, refreshToken, user: { id: body.email, email: body.email } };
  });

  fastify.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request: any, reply: any) => {
    const body = refreshSchema.parse(request.body);
    const accessToken = sign({ sub: body.refreshToken, type: 'access' }, { expiresIn: '24h' });
    return { accessToken };
  });

  fastify.post('/auth/logout', { preHandler: authMiddleware }, async () => ({ ok: true }));

  fastify.get('/auth/me', { preHandler: authMiddleware }, async (request: any) => {
    return { user: getCurrentUser(request) };
  });
}
