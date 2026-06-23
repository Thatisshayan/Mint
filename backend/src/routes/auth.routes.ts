import fastify from 'fastify';

export async function authRoutes(fastify: any) {
  fastify.get('/auth/me', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    return { user };
  });

  fastify.post('/auth/magic-link', async (request: any, reply: any) => {
    const { email } = request.body as { email: string };
    if (!email) {
      return reply.status(400).send({ error: 'BAD_REQUEST', message: 'Email is required' });
    }
    // TODO: implement magic-link email flow
    return {
      message: 'If that email exists, a magic link has been sent.',
      devToken: 'dev-magic-link-token-placeholder',
    };
  });
}
