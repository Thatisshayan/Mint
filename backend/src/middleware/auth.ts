import { FastifyRequest, FastifyReply } from 'fastify';

type AuthenticatedUser = { sub: string; email?: string };

type JwtPlugin = {
  verify(token: string): AuthenticatedUser;
};

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Missing authorization' });
  }
  try {
    const token = auth.slice('Bearer '.length);
    const maybeJwt = (request.server as { jwt?: JwtPlugin }).jwt;
    if (typeof maybeJwt?.verify === 'function') {
      const decoded = maybeJwt.verify(token);
      (request as unknown as { user: AuthenticatedUser }).user = decoded;
    } else {
      return reply.status(401).send({ message: 'Invalid token' });
    }
  } catch {
    return reply.status(401).send({ message: 'Invalid token' });
  }
}
