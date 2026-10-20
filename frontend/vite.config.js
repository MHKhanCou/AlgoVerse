import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      'process.env': {},
      'process': {},
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // Proxy API requests in development to avoid CORS issues
        '/api': {
          target: 'https://algoverse-kpwz.onrender.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      // Never publish source maps: Vercel serves every file in dist, so
      // "hidden" maps would still be downloadable at their .map URLs.
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['axios', 'react-toastify'],
            monaco: ['@monaco-editor/react'],
            graphflow: ['@xyflow/react'],
            // Heavy, route-specific libraries. Without these they all landed
            // in the main entry chunk (~577 kB), so every visitor downloaded
            // charting and animation code just to see the home page.
            charts: ['chart.js', 'react-chartjs-2'],
            animation: ['gsap', 'framer-motion'],
            syntax: ['react-syntax-highlighter'],
          },
        },
      },
    },
  };
});
