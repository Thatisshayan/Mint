import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAIProvider } from '../services/ai/index.js';
import { getPromptWithVariation, recordRating, getPromptStats } from '../services/ai/prompts.js';
import { logAiUsage, getUsageStats } from '../services/ai/costTracker.js';
import { moderateContent } from '../services/ai/moderation.js';
import { getAllCircuitBreakers } from '../lib/circuitBreaker.js';
import { authMiddleware } from '../middleware/auth.js';

const generateSchema = z.object({
  type: z.enum(['script', 'caption', 'thumbnail', 'hook', 'scenario', 'full_package']),
  topic: z.string().min(3, 'Topic is required').max(2000),
  tone: z.enum(['professional', 'casual', 'educational', 'entertaining']).optional(),
  model: z.string().max(100).optional(),
});

export default async function studioRoutes(fastify: FastifyInstance) {
  fastify.post('/studio/generate', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = generateSchema.parse(request.body);
    const provider = getAIProvider();

    const startTime = Date.now();

    let prompt: string;
    let variationId = 'default';

    if (body.type === 'full_package') {
      const scriptVar = getPromptWithVariation('script', { topic: body.topic, tone: body.tone });
      const captionVar = getPromptWithVariation('caption', { topic: body.topic, tone: body.tone });
      const thumbVar = getPromptWithVariation('thumbnail', { topic: body.topic, tone: body.tone });
      prompt = [scriptVar.prompt, '---', captionVar.prompt, '---', thumbVar.prompt].join('\n\n');
      variationId = `full:${scriptVar.variationId},${captionVar.variationId},${thumbVar.variationId}`;
    } else {
      const result = getPromptWithVariation(body.type, { topic: body.topic, tone: body.tone });
      prompt = result.prompt;
      variationId = result.variationId;
    }

    const result = await provider.generateText({
      prompt,
      model: body.model,
      temperature: body.type === 'script' || body.type === 'hook' ? 0.7 : 0.4,
      maxTokens: body.type === 'full_package' ? 4096 : 2048,
    });

    const durationMs = Date.now() - startTime;

    const moderation = moderateContent(result.output);
    if (moderation.flagged) {
      logAiUsage({
        provider: result.provider,
        model: result.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        contentType: body.type,
        durationMs,
        success: false,
        error: moderation.reason,
      });
      return reply.status(400).send({
        error: 'CONTENT_FLAGGED',
        message: moderation.reason || 'Content was flagged by moderation',
      });
    }

    logAiUsage({
      provider: result.provider,
      model: result.model,
      promptTokens: Math.ceil(prompt.length / 4),
      completionTokens: Math.ceil(result.output.length / 4),
      totalTokens: Math.ceil((prompt.length + result.output.length) / 4),
      contentType: body.type,
      durationMs,
      success: true,
    });

    return {
      id: crypto.randomUUID(),
      type: body.type,
      content: result.output,
      model: result.model,
      provider: result.provider,
      variationId,
      createdAt: new Date().toISOString(),
    };
  });

  fastify.post('/studio/generate-image', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({ prompt: z.string().min(1) }).parse(request.body);
    const startTime = Date.now();
    const { generateComfyUIImage } = await import('../services/ai/comfyui.service.js');
    const result = await generateComfyUIImage({ prompt: body.prompt });
    logAiUsage({
      provider: 'comfyui',
      model: 'stable-diffusion',
      promptTokens: Math.ceil(body.prompt.length / 4),
      completionTokens: 0,
      totalTokens: Math.ceil(body.prompt.length / 4),
      contentType: 'image',
      durationMs: Date.now() - startTime,
      success: true,
    });
    return result;
  });

  fastify.post('/studio/generate-voice', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({ text: z.string().min(1).max(5000), voice: z.string().optional() }).parse(request.body);
    const { generateSpeech } = await import('../services/ai/tts.service.js');
    return await generateSpeech({ text: body.text, voice: body.voice });
  });

  fastify.post('/studio/generate-video', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({
      script: z.string().min(1).max(10000),
      title: z.string().max(200).optional(),
      platform: z.enum(['youtube_shorts', 'instagram_reel', 'tiktok']).optional(),
      voice: z.string().optional(),
    }).parse(request.body);
    const { generateVideo } = await import('../services/ai/video.service.js');
    return await generateVideo({ script: body.script, title: body.title, platform: body.platform, voice: body.voice });
  });

  fastify.get('/studio/generate-video/:taskId', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const { taskId } = request.params as { taskId: string };
    const mptUrl = process.env.MONEY_PRINTER_URL || 'http://localhost:8501';
    const res = await fetch(`${mptUrl}/api/v1/video/status/${taskId}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { status: 'unknown', taskId };
    return await res.json();
  });

  fastify.post('/studio/search-stock', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = z.object({ query: z.string().min(1) }).parse(request.body);
    const { searchStockVideos } = await import('../services/ai/pexels.service.js');
    return await searchStockVideos({ query: body.query });
  });

  fastify.post('/studio/assemble-video', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = z.object({
      clips: z.array(z.object({
        type: z.enum(['video', 'image', 'text']),
        source: z.string().optional(),
        duration: z.number().optional(),
      })),
      audioUrl: z.string().optional(),
    }).parse(request.body);
    const { assembleVideo } = await import('../services/ai/assembly.service.js');
     
    return await assembleVideo({ clips: body.clips as any, audioUrl: body.audioUrl });
  });

  fastify.post('/studio/transcribe', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = z.object({ audioBase64: z.string().min(1) }).parse(request.body);
    const { transcribeAudio } = await import('../services/ai/whisper.service.js');
    return await transcribeAudio({ audioBase64: body.audioBase64 });
  });

  const generateIdeasSchema = z.object({
    projectId: z.string().min(1),
    brief: z.string().min(10).max(4000),
    tone: z.enum(['professional', 'casual', 'educational', 'entertaining']).optional(),
    count: z.number().min(1).max(10).optional(),
  });

  fastify.post('/studio/generate-ideas', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = generateIdeasSchema.parse(request.body);
    const userId = request.user?.sub || request.user?.email;
    const { generateIdeas } = await import('../services/studio.service.js');
    return await generateIdeas(userId, body);
  });

  fastify.post('/studio/rate', { preHandler: authMiddleware }, async (request: FastifyRequest) => {
    const body = z.object({
      type: z.string(),
      variationId: z.string(),
      rating: z.number().min(1).max(5),
    }).parse(request.body);
    recordRating(body.type, body.variationId, body.rating);
    return { success: true };
  });

  fastify.get('/studio/prompt-stats', { preHandler: authMiddleware }, async () => {
    return getPromptStats();
  });

  fastify.get('/studio/cost-stats', { preHandler: authMiddleware }, async () => {
    return getUsageStats();
  });

  fastify.get('/studio/ai-status', { preHandler: authMiddleware }, async () => {
    const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasOllama = !!process.env.OLLAMA_BASE_URL;
    const hasComfyUI = !!process.env.COMFYUI_BASE_URL;

    const primary = process.env.LLM_PROVIDER || 'deepseek';
    let activeProvider = 'ollama';
    if (primary === 'deepseek' && hasDeepSeek) activeProvider = 'deepseek';
    else if (primary === 'openai' && hasOpenAI) activeProvider = 'openai';
    else if (hasDeepSeek) activeProvider = 'deepseek';
    else if (hasOpenAI) activeProvider = 'openai';

    const circuitBreakers = getAllCircuitBreakers();

    return {
      activeProvider,
      providers: {
        deepseek: hasDeepSeek,
        openai: hasOpenAI,
        ollama: hasOllama,
        comfyui: hasComfyUI,
      },
      circuitBreakers,
    };
  });
}