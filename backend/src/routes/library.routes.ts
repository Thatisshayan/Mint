import fastify from 'fastify';

export default async function libraryRoutes(fastify: any) {
  fastify.get('/library', async () => ({ items: [] }));
}
