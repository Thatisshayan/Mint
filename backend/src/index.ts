import fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';

export async function buildApp() {
  const app = fastify({
    logger: {
      level: config.env === 'production' ? 'info' : 'debug',
      transport: config.env === 'production' ? undefined : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
    },
  });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
  }));

  app.setErrorHandler((err: any, request: any, reply: any) => {
    (request.log as any).error(err);
    reply.status(err.statusCode || 500).send({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong',
    });
  });

  await app.register(require('@fastify/jwt')).then((reg: any) => reg.default ?? reg);
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
    }
  });

  await app.register(require('./routes/auth.routes.js'));
  await app.register(require('./routes/projects.routes.js'), { prefix: '/api' });
  await app.register(require('./routes/research.routes.js'), { prefix: '/api' });
  await app.register(require('./routes/studio.routes.js'), { prefix: '/api' });
  await app.register(require('./routes/library.routes.js'), { prefix: '/api' });
  await app.register(require('./routes/publish.routes.js'), { prefix: '/api' });

  const start = async () => {
    try {
      await app.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  void start();

  return app;
}
