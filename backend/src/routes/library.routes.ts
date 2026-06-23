import fastify from 'fastify';

export async function libraryRoutes(fastify: any) {
  fastify.get('/library', async (request: any, reply: any) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' });
    return { items: [] };
  });
}
