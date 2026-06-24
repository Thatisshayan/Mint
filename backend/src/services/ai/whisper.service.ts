import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const exec = promisify(execFile);

export interface TranscriptionOptions {
  audioBase64: string;
  language?: string;
}

export interface TranscriptionResult {
  text: string;
  segments?: Array<{ start: number; end: number; text: string }>;
  language: string;
}

export async function transcribeAudio({ audioBase64, language = 'en' }: TranscriptionOptions): Promise<TranscriptionResult> {
  // Try Whisper via local CLI first
  try {
    const tmpDir = await mkdtemp(join(tmpdir(), 'mint-whisper-'));
    const inputPath = join(tmpDir, 'input.mp3');
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    await writeFile(inputPath, audioBuffer);

    const { stdout } = await exec('whisper', [inputPath, '--language', language, '--output_format', 'json', '--model', 'base'], {
      timeout: 120_000,
    });

    try { await unlink(inputPath); } catch {}
    try { await rmdir(tmpDir, { recursive: true }); } catch {}

    const result = JSON.parse(stdout) as { text: string; segments?: Array<{ start: number; end: number; text: string }> };
    return { text: result.text || '', segments: result.segments, language };
  } catch {
    // Fallback: return empty transcription
    return { text: '', language };
  }
}
