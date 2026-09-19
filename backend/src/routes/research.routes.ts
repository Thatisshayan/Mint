import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAIProviderAsync } from '../services/ai/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { config } from '../config.js';

const createResearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000, 'Query too long'),
  source: z.string().max(100, 'Source too long').optional(),
});

const researchPrompt = (query: string) =>
  `You are a research analyst. Analyze this topic and provide:\n` +
  `- Key trends (3 bullet points)\n` +
  `- Competitor angles\n` +
  `- Content opportunities\n` +
  `- Target audience insights\n\nTopic: "${query}"`;

export default async function researchRoutes(fastify: FastifyInstance) {
  fastify.get('/research', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const { listResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    return { reports: await listResearch(userId) };
  });

  fastify.post('/research', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = createResearchSchema.parse(request.body);
    const provider = await getAIProviderAsync();
    const result = await provider.generateText({
      prompt: researchPrompt(body.query),
      temperature: 0.3,
      maxTokens: 3072,
    });

    const { createResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    const report = await createResearch(userId, {
      projectId: undefined,
      query: body.query,
      summary: result.output,
      source: result.provider,
    });

    return {
      id: report?.id || crypto.randomUUID(),
      query: body.query,
      source: result.provider,
      summary: result.output,
      createdAt: new Date().toISOString(),
    };
  });

  fastify.get('/research/:id', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { getResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    const report = await getResearch(userId, id);
    if (!report) {
      throw new Error('Research report not found');
    }
    return report;
  });

  fastify.delete('/research/:id', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { deleteResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    await deleteResearch(userId, id);
    reply.status(204);
    return { success: true };
  });

  fastify.get('/research/stream', { websocket: true }, async (socket, request) => {
    // @fastify/websocket v11's handler receives the raw WebSocket directly as
    // the first argument (not wrapped in a `connection.socket`, which was the
    // pre-v8 shape) — confirmed against the current README, not guessed.

    // WS handshakes can't carry an Authorization header — accept the token as
    // a query param instead. Known tradeoff: tokens in URLs can leak into
    // access logs/history — a generally-discouraged pattern. Accepted here
    // because MINT is single-user and localhost-only (same risk class as the
    // dev-mode dummy token already in use), but flagging it rather than
    // presenting it as risk-free.
    let userId: string;
    if (config.disableAuth) {
      userId = 'single-user';
    } else {
      const token = (request.query as { token?: string })?.token;
      if (!token) {
        socket.close(4001, 'Missing token');
        return;
      }
      try {
        const decoded = (await fastify.jwt.verify(token)) as { sub: string; email?: string };
        userId = decoded.sub || decoded.email || 'unknown';
      } catch {
        socket.close(4001, 'Invalid token');
        return;
      }
    }

    socket.on('message', async (raw: Buffer) => {
      let msg: { query?: string };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        return;
      }
      const query = msg.query?.trim();
      if (!query) {
        socket.send(JSON.stringify({ type: 'error', message: 'Missing query' }));
        return;
      }

      const { createResearch } = await import('../services/research.service.js');
      const { runResearch } = await import('../services/ai/gptResearcher.service.js');

      try {
        const result = await runResearch(query, {
          onProgress: (message) => {
            socket.send(JSON.stringify({ type: 'progress', message }));
          },
        });

        const report = await createResearch(userId, {
          query,
          summary: result.report,
          source: 'gpt-researcher',
          citations: result.sources,
        });

        socket.send(
          JSON.stringify({
            type: 'done',
            report: result.report,
            sources: result.sources,
            id: report?.id,
          }),
        );
      } catch {
        // GPT Researcher unreachable or failed after connecting — fall back
        // to the existing LLM-guess path rather than leaving the user with
        // nothing.
        socket.send(
          JSON.stringify({
            type: 'progress',
            message: 'Falling back to local AI (research service unavailable)',
          }),
        );

        try {
          const provider = await getAIProviderAsync();
          const fallbackResult = await provider.generateText({
            prompt: researchPrompt(query),
            temperature: 0.3,
            maxTokens: 3072,
          });

          const report = await createResearch(userId, {
            query,
            summary: fallbackResult.output,
            source: 'ai-fallback',
          });

          socket.send(
            JSON.stringify({
              type: 'done',
              report: fallbackResult.output,
              sources: [],
              id: report?.id,
            }),
          );
        } catch (fallbackErr) {
          socket.send(
            JSON.stringify({
              type: 'error',
              message: (fallbackErr as Error).message || 'Research failed',
            }),
          );
        }
      }
    });
  });
}