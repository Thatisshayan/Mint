// Simple auth middleware for Fastify 4.
// Desktop mode: skip auth entirely (single-user app).
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Desktop mode: skip auth, inject default user
  if (process.env.MINT_DESKTOP === 'true') {
    request.user = { sub: 'desktop-user', email: 'user@mint.local' };
    return;
  }

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
