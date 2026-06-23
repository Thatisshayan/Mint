import fastify from 'fastify';
import { z } from 'zod';
import { generateWithOllama } from '../services/studio.service.js';

export async function studioRoutes(fastify: any) {
  fastify.post('/studio/generate', async (request: any, reply: any) => {
    const body = request.body as { prompt?: string; model?: string };
    return {
      id: 'local-' + Date.now(),
      content: 'Local generation placeholder. Connect Ollama next.',
      platform: body.model || 'ollama',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}
