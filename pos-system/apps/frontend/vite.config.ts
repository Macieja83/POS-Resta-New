import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In production, default to same-origin `/api` (backend serves the frontend).
// You can override with VITE_API_URL if you ever host API separately.
const productionApiBase = process.env.VITE_API_URL?.trim()?.replace(/\/$/, '') || '';

export default defineConfig({
  plugins: [react()],
  define: {
    __POS_API_BASE__: JSON.stringify(process.env.NODE_ENV === 'production' ? productionApiBase : ''),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === '1',
    },
  },
});
