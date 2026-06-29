import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Required for Tauri production: assets are served from filesystem (file://),
  // so all paths must be relative. Default base '/' resolves to drive root.
  base: './',
  build: {
    outDir: 'frontend/dist',
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
});
