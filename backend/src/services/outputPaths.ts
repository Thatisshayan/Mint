import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync, statSync, readdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { config } from '../config.js';

export const MINT_OUTPUT_ROOT = config.outputBaseDir;

export const MINT_SUBDIRS = {
  text: 'text',
  audio: 'audio',
  video: 'video',
  transcripts: 'transcripts',
  images: 'images',
  comfyui: 'images/comfyui',
  mpt: 'video/mpt',
  exports: 'exports',
  logs: 'logs',
} as const;

export type MintSubdir = keyof typeof MINT_SUBDIRS;

/**
 * Returns the absolute path to a MINT subdirectory under OUTPUT_BASE_DIR,
 * creating it if missing. Use this every time you save a file so the
 * folder structure stays consistent.
 */
export function mintDir(subdir: MintSubdir): string {
  const p = join(MINT_OUTPUT_ROOT, MINT_SUBDIRS[subdir]);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
  return p;
}

/**
 * Helper to write a blob to disk under a MINT subdir and return its public
 * relative URL (served by /api/files/...).
 */
export function saveMintBlob(
  subdir: MintSubdir,
  extension: string,
  data: Buffer | string,
): { absolutePath: string; filename: string; publicUrl: string } {
  const dir = mintDir(subdir);
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension.replace(/^\./, '')}`;
  const absolutePath = join(dir, filename);
  writeFileSync(absolutePath, data);
  const publicUrl = `/api/files/${subdir}/${filename}`;
  return { absolutePath, filename, publicUrl };
}

/**
 * Reads the physical contents under OUTPUT_BASE_DIR grouped by subdir.
 * Used by GET /api/files to power the optional Files page.
 */
export function listMintOutputs(): Record<MintSubdir, MintFileEntry[]> {
  const out: Partial<Record<MintSubdir, MintFileEntry[]>> = {};
  for (const k of Object.keys(MINT_SUBDIRS) as MintSubdir[]) {
    const dir = join(MINT_OUTPUT_ROOT, MINT_SUBDIRS[k]);
    if (!existsSync(dir)) {
      out[k] = [];
      continue;
    }
    const entries = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => {
        const abs = join(dir, d.name);
        let sizeKb = 0;
        let mtime = '';
        try {
          const s = statSync(abs);
          sizeKb = Math.round(s.size / 1024);
          mtime = s.mtime.toISOString();
        } catch {
          // ignore — file probably vanished between readdir and stat
        }
        return {
          filename: d.name,
          subdir: k,
          sizeKb,
          mtime,
          publicUrl: `/api/files/${k}/${encodeURIComponent(d.name)}`,
        };
      })
      .sort((a, b) => b.mtime.localeCompare(a.mtime));
    out[k] = entries;
  }
  return out as Record<MintSubdir, MintFileEntry[]>;
}

export interface MintFileEntry {
  filename: string;
  subdir: MintSubdir;
  sizeKb: number;
  mtime: string;
  publicUrl: string;
}
