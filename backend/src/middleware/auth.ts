import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

export const sendMagicLinkInputSchema = z.object({ email: z.string().email() });

export const verifyMagicLinkInputSchema = z.object({ token: z.string().min(1) });

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Missing authorization' });
  }
  try {
    const token = auth.slice('Bearer '.length);
    const decoded = (request as any).server.jwt.verify<{ sub: string; email?: string }>(token);
    (request as any).user = decoded;
  } catch {
    return reply.status(401).send({ message: 'Invalid token' });
  }
}
