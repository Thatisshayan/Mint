import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Missing authorization' });
  }
  try {
    const token = auth.slice('Bearer '.length);
    const decoded = await request.jwtVerify<{ sub: string }>({ token });
    (request as any).user = decoded;
  } catch {
    return reply.status(401).send({ message: 'Invalid token' });
  }
}
