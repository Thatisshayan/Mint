import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { prisma } from '../services/db.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // If auth is globally disabled (single‑user mode), inject a dummy user
  // and provision its DB row. In this mode `DISABLE_AUTH=true` is set in .env.
  if (config.disableAuth) {
    request.user = { sub: 'single-user', email: 'me@local' };
    await ensureUserExists(request.user.sub, request.user.email);
    return;
  }

  // Normal JWT authentication flow.
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing bearer token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decoded = (await request.server.jwt.verify(token)) as {
      sub: string;
      email?: string;
    };
    // Trust the JWT's email when present; fall back to sub so the User row
    // has a unique identifier we can store against (multiple JWTs for the
    // same address will collapse onto one row via email uniqueness).
    const userId = decoded.sub || decoded.email || 'unknown';
    const userEmail = decoded.email || userId;
    request.user = { sub: userId, email: userEmail };
    await ensureUserExists(userId, userEmail);
  } catch {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}

async function ensureUserExists(id: string, email: string): Promise<void> {
  // Best-effort: a missing user row will block every later insert (FK violation).
  // Keep this fast (single upsert) — skip silently on any DB hiccup so we don't
  // mask real errors downstream.
  try {
    await prisma.user.upsert({
      where: { id },
      create: { id, email, name: email },
      update: {},
    });
  } catch {
    // ignore; the route's insert will surface the real error if it persists
  }
}
