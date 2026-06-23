import fastify from 'fastify';

export async function libraryRoutes(fastify: any) {
  fastify.get('/library', async () => ({ items: [] }));
}
