import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const exec = promisify(execFile);

export interface VideoClip {
  type: 'video' | 'image' | 'text';
  source?: string;
  duration?: number;
  text?: string;
}

export interface AssemblyOptions {
  clips: VideoClip[];
  audioUrl?: string;
  outputFormat?: string;
}

export async function assembleVideo({ clips, audioUrl, outputFormat = 'mp4' }: AssemblyOptions): Promise<{ url: string; format: string }> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mint-asm-'));
  const outputPath = join(tmpDir, `output.${outputFormat}`);

  const parts: string[] = [];
  const filterParts: string[] = [];
  let inputIndex = 0;

  for (const clip of clips) {
    if (clip.source) {
      parts.push(`-i`, clip.source);
      filterParts.push(`[${inputIndex}:v]`);
      inputIndex++;
    }
  }

  try {
    const args: string[] = [];

    if (parts.length > 0) {
      args.push(...parts);
      args.push('-filter_complex', `${filterParts.join('')}concat=n=${filterParts.length}:v=1:a=0[out]`);
      args.push('-map', '[out]');
    }

    if (audioUrl) {
      args.push('-i', audioUrl);
      args.push('-c:a', 'aac');
      args.push('-shortest');
    }

    args.push('-c:v', 'libx264');
    args.push('-preset', 'fast');
    args.push('-y', outputPath);

    await exec('ffmpeg', args, { timeout: 120_000 });

    const buffer = await require('fs').promises.readFile(outputPath);
    const base64 = buffer.toString('base64');

    // Cleanup
    try { await unlink(outputPath); } catch {}
    try { await require('fs').promises.rmdir(tmpDir); } catch {}

    return { url: `data:video/${outputFormat};base64,${base64}`, format: outputFormat };
  } catch (err) {
    try { await require('fs').promises.rmdir(tmpDir, { recursive: true }); } catch {}
    throw new Error(`Video assembly failed: ${(err as Error).message}`);
  }
}
