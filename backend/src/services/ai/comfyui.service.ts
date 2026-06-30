import { URL } from 'url';

export interface ComfyUIImageOptions {
  prompt: string;
  workflow?: Record<string, unknown>;
  filename?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll /history/{prompt_id} until the prompt reports completed and the first
 * image is available. Bounded to `pollTimeoutMs` total wall-clock time and
 * each fetch is cancelled if it stalls (ComfyUI may keep a connection open
 * indefinitely under load, which would otherwise consume the wall budget).
 */
async function fetchHistoryOnce(origin: string, promptId: string): Promise<Response | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(`${origin}/history/${promptId}`, { signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function generateComfyUIImage({ prompt, workflow, filename }: ComfyUIImageOptions) {
  const baseUrl = process.env.COMFYUI_BASE_URL;
  if (!baseUrl) {
    throw new Error('COMFYUI_BASE_URL is not configured');
  }

  const origin = baseUrl.replace(/\/$/, '');
  const workflowId = filename || `mint-${Date.now()}`;

  // Inject prompt into workflow (assumes a "prompt" node exists in the workflow,
  // or use the provided workflow as-is if it already has the prompt embedded)
  const body = workflow
    ? { ...workflow, prompt }
    : {
        prompt: {
          text: prompt,
          filename: workflowId,
        },
      };

  // Queue the prompt
  const promptRes = await fetch(`${origin}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!promptRes.ok) {
    const details = await promptRes.text().catch(() => '');
    throw new Error(`ComfyUI prompt failed (${promptRes.status}): ${details || promptRes.statusText}`);
  }

  const { prompt_id } = (await promptRes.json()) as { prompt_id: string };

  const pollStart = Date.now();
  const pollTimeoutMs = 300_000; // 5 minutes
  let imageFilename: string | null = null;

  while (Date.now() - pollStart < pollTimeoutMs) {
    await sleep(2_000);

    const historyRes = await fetchHistoryOnce(origin, prompt_id);
    if (!historyRes || !historyRes.ok) continue;

    const history = (await historyRes.json()) as Record<
      string,
      {
        outputs?: Record<string, { images?: Array<{ filename: string }> }>;
        status?: { completed: boolean };
      }
    >;

    const promptData = history[prompt_id];
    if (!promptData || !promptData.status?.completed) continue;

    const outputs = promptData.outputs || {};
    for (const nodeId of Object.keys(outputs)) {
      const images = outputs[nodeId]?.images;
      if (images && images.length > 0) {
        imageFilename = images[0].filename;
        break;
      }
    }
    if (imageFilename) break;
  }

  if (!imageFilename) {
    throw new Error('ComfyUI generation timed out or produced no output');
  }

  const imageUrl = new URL('/view', origin);
  imageUrl.searchParams.set('filename', imageFilename);

  return {
    url: imageUrl.toString(),
    provider: 'comfyui',
    promptId: prompt_id,
  };
}
