import type { Provider } from './types.js';

export interface ComfyUIWorkflow {
  prompt: string;
  width: number;
  height: number;
  steps?: number;
  cfg?: number;
  sampler?: string;
  scheduler?: string;
  seed?: number;
  model?: string;
}

export interface ComfyUIResponse {
  images?: Array<{ filename: string; type: string; subfolder?: string }>;
}

export class ComfyUIProvider implements Provider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async generateImage(params: ComfyUIWorkflow): Promise<Buffer> {
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Minimal default workflow: KSampler + VAE decode + SaveImage
    // We use a very conservative structure that matches common ComfyUI setups.
    // The actual node IDs/names may need to align with the user's local config,
    // but this generic pattern works for most default installs with SD1.5/SDXL.
    const workflow = {
      '3': {
        class_type: 'KSampler',
        inputs: {
          seed: params.seed ?? Math.floor(Math.random() * 2 ** 32),
          steps: params.steps ?? 20,
          cfg: params.cfg ?? 7,
          sampler_name: params.sampler ?? 'dpmpp_2m',
          scheduler: params.scheduler ?? 'normal',
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
      },
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: params.model ?? 'v1-5-pruned-emaonly.safetensors',
        },
      },
      '5': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width: params.width,
          height: params.height,
          batch_size: 1,
        },
      },
      '6': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: params.prompt,
          clip: ['4', 1],
        },
      },
      '7': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: '',
          clip: ['4', 1],
        },
      },
      '8': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
      },
      '9': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'MINT',
          images: ['8', 0],
        },
      },
    };

    // Queue the prompt
    const queueResponse = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    });

    if (!queueResponse.ok) {
      const text = await queueResponse.text().catch(() => 'ComfyUI queue failed');
      throw new Error(`ComfyUI queue error: ${queueResponse.status} ${text}`);
    }

    const { prompt_id } = (await queueResponse.json()) as { prompt_id?: string };
    if (!prompt_id) throw new Error('ComfyUI did not return a prompt_id');

    // Poll for completion
    const result = await this.waitForCompletion(clientId, prompt_id);
    const image = result.images?.[0];
    if (!image?.filename) throw new Error('ComfyUI did not return an image');

    // Fetch the generated image bytes
    const imageUrl = new URL(
      `/view?filename=${encodeURIComponent(image.filename)}&type=${encodeURIComponent(image.type)}`,
      this.baseUrl,
    ).toString();

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
    }
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  private async waitForCompletion(
    clientId: string,
    promptId: string,
    timeoutMs = 120_000,
  ): Promise<ComfyUIResponse> {
    const wsUrl = new URL('/ws', this.baseUrl);
    wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl.toString());

      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('ComfyUI generation timed out'));
      }, timeoutMs);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'execution_complete' && msg.data?.prompt_id === promptId) {
            clearTimeout(timer);
            ws.close();
            resolve({ images: [] });
          }
          if (msg.type === 'execution_cached' && msg.data?.prompt_id === promptId) {
            // Still wait for execution_complete
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        clearTimeout(timer);
        ws.close();
        reject(new Error('ComfyUI WebSocket error'));
      };

      ws.onopen = async () => {
        try {
          // Poll history endpoint for result
          const check = async () => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const resp = await fetch(`${this.baseUrl}/history/${promptId}`);
            if (!resp.ok) return;
            const data = (await resp.json()) as Record<
              string,
              { outputs?: Record<string, { images?: ComfyUIResponse['images'] }> }
            >;
            const record = data[promptId];
            const images = record?.outputs?.['9']?.images;
            if (images && images.length > 0) {
              clearTimeout(timer);
              ws.close();
              resolve({ images });
            } else {
              setTimeout(check, 1500);
            }
          };
          check();
        } catch (err) {
          clearTimeout(timer);
          ws.close();
          reject(err as Error);
        }
      };
    });
  }
}
