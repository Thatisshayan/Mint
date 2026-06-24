import { URL } from 'url';

export interface ComfyUIImageOptions {
  prompt: string;
  workflow?: Record<string, unknown>;
  filename?: string;
}

export async function generateComfyUIImage({ prompt, workflow, filename }: ComfyUIImageOptions) {
  const baseUrl = process.env.COMFYUI_BASE_URL;
  if (!baseUrl) {
    throw new Error('COMFYUI_BASE_URL is not configured');
  }

  const origin = baseUrl.replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const workflowId = filename || `mint-${Date.now()}.png`;
    const promptResponse = await fetch(`${origin}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(workflow ?? {}),
        input: {
          text: prompt,
          filename: workflowId,
        },
      }),
      signal: controller.signal,
    });

    if (!promptResponse.ok) {
      const details = await promptResponse.text().catch(() => '');
      throw new Error(`ComfyUI prompt failed (${promptResponse.status}): ${details || promptResponse.statusText}`);
    }

    const imageUrl = new URL('/view', origin);
    imageUrl.searchParams.set('filename', workflowId);

    return {
      url: imageUrl.toString(),
      provider: 'comfyui',
    };
  } finally {
    clearTimeout(timeout);
  }
}
