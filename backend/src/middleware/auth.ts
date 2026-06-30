import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // If auth is globally disabled (single‑user mode), inject a dummy user.
  if (config.disableAuth) {
    request.user = { sub: 'single-user', email: 'me@local' };
    return;
  }

  // Normal JWT authentication flow.
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing bearer token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decoded = await request.server.jwt.verify(token);
    request.user = decoded as { sub: string; email: string };
  } catch {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}
