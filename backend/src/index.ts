import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { projectRoutes } from './routes/projects.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { researchRoutes } from './routes/research.routes.js';
import { studioRoutes } from './routes/studio.routes.js';
import { libraryRoutes } from './routes/library.routes.js';
import { publishRoutes } from './routes/publish.routes.js';

dotenv.config();

const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev' });

app.register(projectRoutes, { prefix: '/api' });
app.register(authRoutes, { prefix: '/api' });
app.register(researchRoutes, { prefix: '/api' });
app.register(studioRoutes, { prefix: '/api' });
app.register(libraryRoutes, { prefix: '/api' });
app.register(publishRoutes, { prefix: '/api' });

app.get('/health', async () => ({ ok: true }));

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();

export { app };
