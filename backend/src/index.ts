import fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';

export async function buildApp() {
  const app = fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
  }));

  app.setErrorHandler((err: any, request: any, reply: any) => {
    request.log.error(err);
    reply.status(err.statusCode || 500).send({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong',
    });
  });

  await app.register((await import('./routes/auth.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/projects.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/research.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/studio.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/library.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/publish.routes.js')).default, { prefix: '/api' });

  const start = async () => {
    try {
      await app.listen({ port: Number(process.env.PORT || 4000), host: '0.0.0.0' });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  void start();

  return app;
}
