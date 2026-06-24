import { z } from 'zod';
import { getAIProvider } from '../services/ai/index.js';
import { authMiddleware } from '../middleware/auth.js';

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

export default async function researchRoutes(fastify: any) {
  fastify.get('/research', { preHandler: authMiddleware }, async (request: any) => {
    const { listResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    return { reports: await listResearch(userId) };
  });

  fastify.post('/research', { preHandler: authMiddleware }, async (request: any) => {
    const body = createResearchSchema.parse(request.body);
    const provider = getAIProvider();
    const result = await provider.generateText({
      prompt: researchPrompt(body.query),
      temperature: 0.3,
      maxTokens: 3072,
    });

    const { createResearch } = await import('../services/research.service.js');
    const userId = request.user?.sub || request.user?.email;
    const report = await createResearch(userId, { projectId: '', query: body.query, summary: result.output });

    return {
      id: report?.id || crypto.randomUUID(),
      query: body.query,
      source: result.provider,
      summary: result.output,
      createdAt: new Date().toISOString(),
    };
  });
}
