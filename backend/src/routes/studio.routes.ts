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

  fastify.post('/studio/generate-voice', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const body = z.object({ text: z.string().min(1).max(5000), voice: z.string().optional() }).parse(request.body);
    const { generateSpeech } = await import('../services/ai/tts.service.js');
    return await generateSpeech({ text: body.text, voice: body.voice });
  });

  fastify.post('/studio/generate-video', { preHandler: authMiddleware }, async (request: any, reply: any) => {
    const body = z.object({
      script: z.string().min(1).max(10000),
      title: z.string().max(200).optional(),
      platform: z.enum(['youtube_shorts', 'instagram_reel', 'tiktok']).optional(),
      voice: z.string().optional(),
    }).parse(request.body);
    const { generateVideo } = await import('../services/ai/video.service.js');
    return await generateVideo({ script: body.script, title: body.title, platform: body.platform, voice: body.voice });
  });

  fastify.get('/studio/generate-video/:taskId', { preHandler: authMiddleware }, async (request: any) => {
    const { taskId } = request.params as { taskId: string };
    const mptUrl = process.env.MONEY_PRINTER_URL || 'http://localhost:8501';
    const res = await fetch(`${mptUrl}/api/v1/video/status/${taskId}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { status: 'unknown', taskId };
    return await res.json();
  });
}
