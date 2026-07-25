export interface VideoGenOptions {
  script: string;
  title?: string;
  platform?: 'youtube_shorts' | 'instagram_reel' | 'tiktok';
  voice?: string;
  duration?: number;
}

export interface VideoGenResult {
  url: string;
  provider: string;
  taskId?: string;
  durationMs?: number;
}

function aspectForPlatform(platform?: VideoGenOptions['platform']): '9:16' | '16:9' {
  return platform === 'youtube_shorts' || platform === 'instagram_reel' || platform === 'tiktok'
    ? '9:16'
    : '16:9';
}

export async function generateVideo(options: VideoGenOptions): Promise<VideoGenResult> {
  const mptUrl = process.env.MONEY_PRINTER_URL || 'http://localhost:8501';
  const endpoint = (process.env.MONEY_PRINTER_ENDPOINT || '').replace(/\/+$/, '');

  const payload = {
    video_subject: options.title || 'MINT Generated',
    video_script: options.script,
    video_aspect: aspectForPlatform(options.platform),
    voice_name: options.voice || 'en-US-JennyNeural',
    bgm_type: 'random',
    subtitle_enabled: true,
    video_source: 'pexels',
    video_concat_mode: 'random',
    video_clip_duration: 5,
    video_count: 1,
  };

  const create = await fetch(`${mptUrl}/api/v1/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });

  if (!create.ok) {
    const details = await create.text().catch(() => '');
    throw new Error(`MPT task create failed (${create.status}): ${details || create.statusText}`);
  }

  const created = (await create.json()) as {
    data?: { task_id?: string };
    task_id?: string;
  };
  const taskId = created?.data?.task_id ?? created?.task_id;
  if (!taskId) {
    throw new Error('MPT did not return a task_id');
  }

  const deadline = Date.now() + 300_000;
  const pollIntervalMs = 5_000;
  let finalPath: string | undefined;
  let finalState: number | string | undefined;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const poll = await fetch(`${mptUrl}/api/v1/tasks/${taskId}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!poll.ok) continue;
    const polled = (await poll.json()) as {
      data?: {
        state?: number | string;
        videos?: string[];
        combined_videos?: string[];
      };
      state?: number | string;
      videos?: string[];
      combined_videos?: string[];
    };
    finalState = polled?.data?.state ?? polled?.state;
    finalPath =
      polled?.data?.videos?.[0] ??
      polled?.data?.combined_videos?.[0] ??
      polled?.videos?.[0] ??
      polled?.combined_videos?.[0];

    if (finalState === 1 || finalState === 'finished' || finalState === 'success' || finalState === 'completed') {
      break;
    }
    if (finalState === -1 || finalState === 'failed' || finalState === 'error') {
      throw new Error(`MPT task ${taskId} failed`);
    }
  }

  if (!finalPath) {
    throw new Error('MPT task did not produce a video before timeout');
  }

  const baseForUrl = endpoint || mptUrl;
  return {
    url: `${baseForUrl}/api/v1/download/${finalPath}`,
    provider: 'moneymaker',
    taskId,
    durationMs: options.duration || undefined,
  };
}
