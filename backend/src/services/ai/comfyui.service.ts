import { URL } from 'url';

export interface ComfyUIImageOptions {
  prompt: string;
  workflow?: Record<string, unknown>;
  filename?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    ? { ...workflow, prompt }  // merge prompt into existing workflow
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

// Poll for completion (max 5 min, check every 2s)
   const pollStart = Date.now();
   const pollTimeout = 300_000;
   let imageFilename: string | null = null;

   while (Date.now() - pollStart < pollTimeout) {
     await sleep(2_000);

     const historyRes = await fetch(`${origin}/history/${prompt_id}`, {
       signal: AbortSignal.timeout(10_000),
     });

     if (!historyRes.ok) continue;

     const history = await historyRes.json() as Record<string, { outputs?: Record<string, { images: Array<{ filename: string }> }>; status?: { completed: boolean } }>;
     const promptData = history[prompt_id];
     if (!promptData || !(promptData.status?.completed)) continue;

     // Extract first generated image filename from outputs
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
