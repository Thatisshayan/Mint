import type { FastifyInstance } from 'fastify';
import { join } from 'path';
import { statSync } from 'fs';
import { readFile } from 'fs/promises';
import { authMiddleware } from '../middleware/auth.js';
import { listMintOutputs, MINT_OUTPUT_ROOT } from '../services/outputPaths.js';
import { config } from '../config.js';

const MIME_BY_EXT: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  json: 'application/json',
  txt: 'text/plain',
  md: 'text/markdown',
};

function guessMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

const SUBDIR_BY_NAME: Record<string, 'audio' | 'video' | 'transcripts' | 'images' | 'text' | 'export'> = {
  audio: 'audio',
  video: 'video',
  transcripts: 'transcripts',
  images: 'images',
  text: 'text',
  exports: 'export',
};

export default async function filesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/files',
    { preHandler: authMiddleware },
    async (_request, reply) => {
      return reply.send({
        root: MINT_OUTPUT_ROOT,
        grouped: listMintOutputs(),
      });
    },
  );

  fastify.get<{ Params: { subdir: string; name: string } }>(
    '/files/:subdir/:name',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { subdir, name } = request.params;
      const kind = SUBDIR_BY_NAME[subdir];
      if (!kind) {
        return reply.status(400).send({ error: 'BAD_SUBDIR' });
      }

      const safeName = name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 200);
      // Resolve the proper MINT subdir path without auto-creating it,
      // then check the file exists. (Avoids EISDIR on bare subdir requests.)
      const folderMap: Record<typeof kind, string> = {
        audio: 'audio',
        video: 'video',
        transcripts: 'transcripts',
        images: 'images',
        text: 'text',
        export: 'exports',
      };
      const filePath = join(MINT_OUTPUT_ROOT, folderMap[kind], safeName);

      // Defense in depth: ensure resolved path still sits inside the root.
      if (!filePath.startsWith(MINT_OUTPUT_ROOT)) {
        return reply.status(400).send({ error: 'PATH_OUTSIDE_ROOT' });
      }

      let stats;
      try {
        stats = statSync(filePath);
      } catch {
        return reply.status(404).send({ error: 'NOT_FOUND' });
      }
      if (!stats.isFile()) {
        return reply.status(404).send({ error: 'NOT_A_FILE' });
      }
      const buf = await readFile(filePath);
      return reply
        .header('Content-Type', guessMime(safeName))
        .header('Cache-Control', 'private, max-age=300')
        .send(buf);
    },
  );

  fastify.get('/files/_config', { preHandler: authMiddleware }, async () => {
    return {
      outputDir: config.outputBaseDir,
      resolved: MINT_OUTPUT_ROOT,
    };
  });
}
