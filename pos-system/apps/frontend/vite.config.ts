import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Wstrzykuj w buildzie pełny URL backendu (Vercel), żeby produkcja nie wołała relative /api (404).
const productionApiBase =
  process.env.VITE_API_URL?.trim()?.replace(/\/$/, '') ||
  'https://pos-system-backend.vercel.app/api';

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
