import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes.js';
import { projectRoutes } from './routes/projects.routes.js';

dotenv.config();

const app = Fastify({
  logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
});

if (process.env.NODE_ENV !== 'production') {
  await app.register(cors, { origin: true });
}

await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'change-me' });
await app.register(multipart);

app.get('/health', async () => ({ status: 'ok' }));

app.register(authRoutes, { prefix: '/api/auth' });
app.register(projectRoutes, { prefix: '/api/projects' });

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
