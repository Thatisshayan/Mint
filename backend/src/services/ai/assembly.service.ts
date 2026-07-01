import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, readFile, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { saveMintBlob } from '../outputPaths.js';

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

export async function assembleVideo({ clips, audioUrl, outputFormat = 'mp4' }: AssemblyOptions): Promise<{ url: string; fileUrl?: string | null; format: string }> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mint-asm-'));
  const outputPath = join(tmpDir, `output.${outputFormat}`);

  const parts: string[] = [];
  const filterParts: string[] = [];
  let inputIndex = 0;

  // Default duration (seconds) when caller doesn't specify it — keeps ffmpeg
  // happy when concatenating images which have no intrinsic duration.
  const DEFAULT_CLIP_DURATION = 5;

  for (const clip of clips) {
    if (!clip.source) continue;
    parts.push('-i', clip.source);
    parts.push('-t', String(clip.duration ?? DEFAULT_CLIP_DURATION));
    filterParts.push(`[${inputIndex}:v]`);
    inputIndex++;
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

    const buffer = await readFile(outputPath);
    const base64 = buffer.toString('base64');

    // Persist to MINT-output/video/ so it can be re-opened later
    // from the Files view or copied out of the user-profile tree.
    let fileUrl: string | null = null;
    try {
      fileUrl = saveMintBlob('video', outputFormat, buffer).publicUrl;
    } catch (err) {
      console.warn('Failed to persist video:', err);
    }

    // Cleanup
    try { await unlink(outputPath); } catch (error) {
      // Ignore cleanup errors
    }
    try { await rmdir(tmpDir); } catch (error) {
      // Ignore cleanup errors
    }

    return {
      url: `data:video/${outputFormat};base64,${base64}`,
      fileUrl,
      format: outputFormat,
    };
} catch (err) {
       try { await rmdir(tmpDir, { recursive: true }); } catch (error) {
         // Ignore cleanup errors
       }
       throw new Error(`Video assembly failed: ${(err as Error).message}`);
     }
}
