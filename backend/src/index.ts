import fastify from 'fastify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { connectDb } from './services/db.js';
import { AppError, ValidationError } from './lib/errors.js';

export async function buildApp() {
  const app = fastify({ logger: { level: config.env === 'production' ? 'warn' : 'info' } });

  // CORS: restrictive in production, permissive in development
  const allowedOrigins = config.env === 'production'
    ? [process.env.FRONTEND_URL || 'https://mint.app']
    : true; // allow all in development

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // JWT: register plugin with secret from config
  await app.register(jwt, { secret: config.jwtSecret });

  // Security headers via Helmet
  await app.register(helmet as any, { contentSecurityPolicy: false });

  // Rate limiting: stricter for auth endpoints, standard for everything else
  await app.register(rateLimit, {
    global: false, // configure per-route
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });

  // Health endpoint (no auth, no rate limit)
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Global error handler with operational error mapping
  app.setErrorHandler((err, _request, reply) => {
    // Operational errors (expected, client-side issues)
    if (err instanceof AppError) {
      reply.status(err.statusCode).send({
        error: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      });
      return;
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
      const validationError = new ValidationError(err as any);
      reply.status(validationError.statusCode).send({
        error: validationError.code,
        message: validationError.message,
        details: validationError.details,
      });
      return;
    }

    // Programming errors / unexpected errors
    app.log.error(err);
    reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: config.env === 'production' ? 'Something went wrong' : err.message,
    });
  });

  // API routes
  await app.register((await import('./routes/auth.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/projects.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/research.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/studio.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/library.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/publish.routes.js')).default, { prefix: '/api' });

  // Serve frontend static files in production (after API routes to avoid conflicts)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    await app.register(fastifyStatic, {
      root: frontendDist,
      prefix: '/',
      wildcard: false,
    });

    const indexHtmlPath = path.join(frontendDist, 'index.html');
    app.setNotFoundHandler((_req, reply) => {
      if (fs.existsSync(indexHtmlPath)) {
        return reply.type('text/html').send(fs.readFileSync(indexHtmlPath, 'utf-8'));
      }
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Route not found' });
    });
  }
  const start = async () => {
    try {
      await connectDb();
      await app.listen({ port: Number(process.env.PORT || 4000), host: '0.0.0.0' });
      app.log.info(`Server running on http://0.0.0.0:${process.env.PORT || 4000}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  void start();

  return app;
}
