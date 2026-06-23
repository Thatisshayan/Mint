// Simple auth middleware for Fastify 4.
// Uses request.server.jwt.verify without extending FastifyRequest's user type.
export async function authMiddleware(request: any, reply: any) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing bearer token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded: any = await request.server.jwt.verify(token);
    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}
