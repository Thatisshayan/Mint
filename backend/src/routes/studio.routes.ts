import { z } from 'zod';
import { getAIProvider, scriptPrompt, captionPrompt, thumbnailPrompt, hookPrompt, scenarioPrompt } from '../services/ai/index.js';
import { authMiddleware } from '../middleware/auth.js';

const generateSchema = z.object({
  type: z.enum(['script', 'caption', 'thumbnail', 'hook', 'scenario', 'full_package']),
  topic: z.string().min(3, 'Topic is required').max(2000),
  tone: z.enum(['professional', 'casual', 'educational', 'entertaining']).optional(),
  model: z.string().max(100).optional(),
});

export default async function studioRoutes(fastify: any) {
  fastify.post('/studio/generate', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const body = generateSchema.parse(request.body);
    const provider = getAIProvider();

    const promptFn = {
      script: scriptPrompt,
      caption: captionPrompt,
      thumbnail: thumbnailPrompt,
      hook: hookPrompt,
      scenario: scenarioPrompt,
      full_package: (input: any) => {
        return [
          scriptPrompt(input),
          '---',
          captionPrompt(input),
          '---',
          thumbnailPrompt(input),
        ].join('\n\n');
      },
    }[body.type];

    const result = await provider.generateText({
      prompt: promptFn({ topic: body.topic, tone: body.tone }),
      model: body.model,
      temperature: body.type === 'script' || body.type === 'hook' ? 0.7 : 0.4,
      maxTokens: body.type === 'full_package' ? 4096 : 2048,
    });

    return {
      id: crypto.randomUUID(),
      type: body.type,
      content: result.output,
      model: result.model,
      provider: result.provider,
      createdAt: new Date().toISOString(),
    };
  });

  fastify.post('/studio/generate-image', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const body = z.object({ prompt: z.string().min(1) }).parse(request.body);
    const { generateComfyUIImage } = await import('../services/ai/comfyui.service.js');
    const result = await generateComfyUIImage({ prompt: body.prompt });
    return result;
  });
}
