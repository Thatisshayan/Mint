/**
 * Bundles the backend into a single JS file using esbuild.
 * Prisma is kept external (native addon) and its generated client is copied
 * into node_modules/ next to the bundle so Node.js can find it.
 */
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'dist');
const nmOut = path.join(outDir, 'node_modules');

mkdirSync(outDir, { recursive: true });

// ── 1. Bundle backend (Prisma kept external) ──────────────────────────────────
await build({
  entryPoints: [path.join(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(outDir, 'server.cjs'),
  external: ['@prisma/client', '*.node', 'fsevents', 'cpu-features', 'ssh2'],
  define: { 'process.env.NODE_ENV': '"production"' },
  target: 'node18',
  absWorkingDir: __dirname,
});

// ── 2. Copy helper ────────────────────────────────────────────────────────────
function copyDir(src, dst, skipPattern) {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (skipPattern && skipPattern.test(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    if (statSync(s).isDirectory()) {
      copyDir(s, d, skipPattern);
    } else {
      copyFileSync(s, d);
    }
  }
}

// Skip WASM bundles — only needed for edge/cloudflare, not native Node.js
const skipWasm = /wasm-base64\.(js|mjs)$/;

// ── 3. Copy @prisma/client (framework JS, skip WASM) ─────────────────────────
const pcSrc = path.join(__dirname, 'node_modules/@prisma/client');
const pcDst = path.join(nmOut, '@prisma/client');
if (existsSync(pcSrc)) {
  copyDir(pcSrc, pcDst, skipWasm);
  console.log('Copied @prisma/client (WASM skipped)');
} else {
  console.warn('Missing: backend/node_modules/@prisma/client — run: prisma generate --schema backend/prisma/schema.prisma');
}

// ── 4. Copy .prisma/client (generated client + native query engine) ───────────
const genSrc = path.join(__dirname, 'node_modules/.prisma/client');
const genDst = path.join(nmOut, '.prisma/client');
if (existsSync(genSrc)) {
  // Skip the WASM engine — we use the native .dll.node
  copyDir(genSrc, genDst, /query_engine_bg\.wasm$/);
  console.log('Copied .prisma/client (generated client + native engine)');
} else {
  console.warn('Missing: backend/node_modules/.prisma/client — run: prisma generate --schema backend/prisma/schema.prisma');
}

console.log('Backend bundle complete: backend/dist/server.cjs');
