import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          // Add Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers
          // These are required for SharedArrayBuffer which is used by FFmpeg.wasm
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@ffmpeg/util']
  },
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    cors: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@ffmpeg/util']
        }
      }
    },
    sourcemap: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  worker: {
    format: 'es'
  },
  // Add public directory configuration to serve FFmpeg files
  publicDir: 'public',
})
