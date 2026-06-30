import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { discover as discoverOllama, setUserSelectedModel } from '../services/ai/ollama-discovery.js';
import { prisma } from '../services/db.js';

interface ServiceStatus {
  name: string;
  url: string | null;
  reachable: boolean;
  detail?: string;
}

async function ping(url: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function gatherStatuses(): Promise<ServiceStatus[]> {
  const ollama = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const comfy = process.env.COMFYUI_BASE_URL || null;
  const piperPath = process.env.PIPER_EXECUTABLE || null;
  const moneyPrinter = process.env.MONEY_PRINTER_BASE_URL || null;

  const out: ServiceStatus[] = [];

  out.push({
    name: 'ollama',
    url: ollama,
    reachable: await ping(`${ollama}/api/version`),
    detail: 'Required for local text generation.',
  });

  if (comfy) {
    out.push({
      name: 'comfyui',
      url: comfy,
      reachable: await ping(comfy),
      detail: 'Local image generation.',
    });
  }
  if (moneyPrinter) {
    out.push({
      name: 'money-printer',
      url: moneyPrinter,
      reachable: await ping(moneyPrinter),
      detail: 'Video generation.',
    });
  }
  if (piperPath) {
    // Piper is a binary, not an HTTP service — we just report whether the
    // configured path exists.
    const fs = await import('fs');
    out.push({
      name: 'piper',
      url: `file://${piperPath}`,
      reachable: fs.existsSync(piperPath),
      detail: 'Local text-to-speech CLI.',
    });
  }
  return out;
}

export default async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/settings/services',
    { preHandler: authMiddleware },
    async (_request: FastifyRequest) => {
      const [services, ollamaModels, userCount] = await Promise.all([
        gatherStatuses(),
        discoverOllama(true),
        prisma.user.count().catch(() => 0),
      ]);

      return {
        services,
        ollama: ollamaModels,
        db: {
          userCount,
        },
        aiProvider: process.env.LLM_PROVIDER || 'ollama',
        jwtSecretConfigured: !!process.env.JWT_SECRET,
        devMode: process.env.NODE_ENV !== 'production',
      };
    },
  );

  fastify.post<{ Body: { model: string | null } }>(
    '/settings/ollama-model',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { model } = request.body || {};
      setUserSelectedModel(model);
      // Force the AI provider to rebuild so the next call picks up the change.
      const { resetAIProvider } = await import('../services/ai/index.js');
      resetAIProvider();
      return reply.send({ ok: true, selected: model });
    },
  );

  fastify.post(
    '/settings/run-migrations',
    { preHandler: authMiddleware },
    async (_request, reply) => {
      // Cheap "self-test" — connect + count tables; if the schema is missing,
      // surface a clear error instead of letting the next write crash.
      try {
        const counts = await prisma.$transaction([
          prisma.user.count(),
          prisma.contentProject.count(),
          prisma.generatedPost.count(),
          prisma.researchReport.count(),
          prisma.template.count(),
        ]);
        return reply.send({
          ok: true,
          tablesPresent: true,
          counts: {
            users: counts[0],
            contentProjects: counts[1],
            generatedPosts: counts[2],
            researchReports: counts[3],
            templates: counts[4],
          },
        });
      } catch (err) {
        return reply.status(500).send({
          ok: false,
          message: (err as Error).message,
        });
      }
    },
  );
}
