import 'dotenv/config';
import fastify from 'fastify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { config } from './config.js';
import { connectDb, disconnectDb, prisma } from './services/db.js';
import { AppError, ValidationError } from './lib/errors.js';

const isDesktop = process.env.MINT_DESKTOP === 'true';

export async function buildApp() {
  const app = fastify({ logger: { level: config.env === 'production' ? 'warn' : 'info' } });

  // CORS: restrictive in production, permissive in development
  // Desktop mode: allow localhost only
  const allowedOrigins = isDesktop
    ? [/^http:\/\/localhost:\d+$/]
    : config.env === 'production'
      ? [process.env.FRONTEND_URL || 'https://mint.app']
      : true;

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // JWT: register plugin with secret from config
  await app.register(jwt, { secret: config.jwtSecret });

  // Security headers via Helmet
   
  await app.register(helmet as any, { contentSecurityPolicy: false });

  // Rate limiting: disable in desktop mode
  if (!isDesktop) {
    await app.register(rateLimit, {
      global: false,
      max: 100,
      timeWindow: '1 minute',
      errorResponseBuilder: (_req: unknown, context: { after: string }) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${context.after}`,
      }),
    });
  }

  // Health endpoint (no auth, no rate limit)
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: isDesktop ? 'desktop' : 'web',
  }));

  // Global error handler with operational error mapping
  app.setErrorHandler((err: Error & { statusCode?: number; name: string }, _request, reply) => {
    if (err instanceof AppError) {
      reply.status(err.statusCode).send({
        error: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      });
      return;
    }

    if (err.name === 'ZodError') {
      const validationError = new ValidationError(err as ZodError);
      reply.status(validationError.statusCode).send({
        error: validationError.code,
        message: validationError.message,
        details: validationError.details,
      });
      return;
    }

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
  await app.register((await import('./routes/template.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/export.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/settings.routes.js')).default, { prefix: '/api' });
  await app.register((await import('./routes/files.routes.js')).default, { prefix: '/api' });

  // Serve frontend static files only in web/server mode (desktop uses Tauri's built-in asset server)
  const frontendDist = !isDesktop
    ? (() => {
        try {
          const dir = path.dirname(fileURLToPath(import.meta.url));
          return path.resolve(dir, '../../frontend/dist');
        } catch {
          return '';
        }
      })()
    : '';
  if (!isDesktop && frontendDist && fs.existsSync(frontendDist)) {
     
    await app.register(fastifyStatic as any, {
      root: frontendDist,
      prefix: '/',
      wildcard: false,
    });

    const indexHtmlPath = path.join(frontendDist, 'index.html');
    app.setNotFoundHandler((_req: unknown, reply) => {
      if (fs.existsSync(indexHtmlPath)) {
        return reply.type('text/html').send(fs.readFileSync(indexHtmlPath, 'utf-8'));
      }
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Route not found' });
    });
  }

  const start = async () => {
    try {
      await connectDb();

      try {
        // Apply Prisma migrations idempotently (best for bundled desktop apps).
        // SAFE TO RUN ON WEB MODE TOO — `migrate deploy` only applies pending.
         
        const { execSync } = await import('child_process');
        try {
          execSync('npx prisma migrate deploy --schema backend/prisma/schema.prisma', {
            stdio: 'pipe',
            timeout: 30_000,
          });
        } catch {
          // Fallback: raw SQL for environments where the prisma CLI isn't shipped.
          await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "email" TEXT NOT NULL,
            "name" TEXT,
            "emailVerified" DATETIME,
            "image" TEXT,
            "passwordHash" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL
          )`);
          await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
          await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ContentProject" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "status" TEXT NOT NULL DEFAULT 'draft',
            "metadata" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "ContentProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          )`);
          await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "GeneratedPost" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "projectId" TEXT,
            "platform" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'draft',
            "tags" TEXT NOT NULL DEFAULT '[]',
            "isFavorite" BOOLEAN NOT NULL DEFAULT false,
            "scheduledAt" DATETIME,
            "metadata" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "GeneratedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          )`);
          await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ResearchReport" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "projectId" TEXT,
            "query" TEXT NOT NULL,
            "source" TEXT NOT NULL,
            "summary" TEXT NOT NULL,
            "citations" TEXT,
            "metadata" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "ResearchReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          )`);
          await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Template" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "topic" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "tone" TEXT NOT NULL,
            "prompt" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          )`);
        }

        // Auto-insert the single-user if running in desktop mode or DISABLE_AUTH.
        if (isDesktop || config.disableAuth) {
          await prisma.user.upsert({
            where: { id: 'desktop-user' },
            create: {
              id: 'desktop-user',
              email: 'user@mint.local',
              name: 'You',
            },
            update: {},
          });
        }
      } catch (migErr) {
        app.log.warn({ err: migErr }, 'Schema init warning (non-fatal)');
      }

      const port = Number(process.env.PORT || 4000);
      // Desktop mode: listen on localhost only
      const host = isDesktop ? '127.0.0.1' : '0.0.0.0';
      await app.listen({ port, host });
      app.log.info(`Server running on http://${host}:${port} ${isDesktop ? '(desktop mode)' : ''}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  void start();

  return app;
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await disconnectDb();
    console.log('Database disconnected.');
  } catch (err) {
    console.error('Error disconnecting database:', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

buildApp();
