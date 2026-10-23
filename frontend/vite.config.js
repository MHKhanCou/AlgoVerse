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
      rolldownOptions: {
        output: {
          // Vite 8 / Rolldown replaced the object form of manualChunks with
          // codeSplitting groups. Keep the heavy route-specific libraries out
          // of the entry chunk so the home page does not download them.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              },
              {
                name: 'vendor',
                test: /node_modules[\\/](axios|react-toastify)[\\/]/,
              },
              {
                name: 'monaco',
                test: /node_modules[\\/]@monaco-editor[\\/]/,
              },
              {
                name: 'graphflow',
                test: /node_modules[\\/]@xyflow[\\/]/,
              },
              {
                name: 'charts',
                test: /node_modules[\\/](chart\.js|react-chartjs-2|@kurkle)[\\/]/,
              },
              {
                name: 'animation',
                test: /node_modules[\\/](gsap|framer-motion|motion-dom|motion-utils)[\\/]/,
              },
              {
                name: 'syntax',
                test: /node_modules[\\/](react-syntax-highlighter|refractor|prismjs)[\\/]/,
              },
            ],
          },
        },
      },
    },
  };
});
