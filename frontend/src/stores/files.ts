import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type MintSubdir =
  | 'text'
  | 'audio'
  | 'video'
  | 'transcripts'
  | 'images'
  | 'comfyui'
  | 'mpt'
  | 'exports'
  | 'logs';

export interface MintFileEntry {
  filename: string;
  subdir: MintSubdir;
  sizeKb: number;
  mtime: string;
  publicUrl: string;
}

export interface FilesConfig {
  outputDir: string;
  resolved: string;
}

export interface FilesResponse {
  root: string;
  grouped: Record<MintSubdir, MintFileEntry[]>;
}

export const SUBDIR_LABELS: Record<MintSubdir, string> = {
  text: 'Text exports',
  audio: 'Voiceovers',
  video: 'Videos',
  transcripts: 'Transcripts',
  images: 'Images',
  comfyui: 'ComfyUI images',
  mpt: 'Money-Printer videos',
  exports: 'DB exports',
  logs: 'App logs',
};

export const SUBDIR_DESCRIPTIONS: Record<MintSubdir, string> = {
  text: 'Saved text content (.txt, .md, .json)',
  audio: 'TTS voiceovers (.mp3)',
  video: 'ffmpeg-assembled clips (.mp4)',
  transcripts: 'Whisper transcription JSON',
  images: 'Generated images (root)',
  comfyui: 'ComfyUI direct output',
  mpt: 'Money-Printer Turbo direct output',
  exports: 'Full-DB JSON backups',
  logs: 'App logs',
};

export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const res = await apiClient.get('/files');
      return res.json() as Promise<FilesResponse>;
    },
    staleTime: 10_000,
  });
}

export function useFilesConfig() {
  return useQuery({
    queryKey: ['files-config'],
    queryFn: async () => {
      const res = await apiClient.get('/files/_config');
      return res.json() as Promise<FilesConfig>;
    },
    staleTime: 60_000,
  });
}
