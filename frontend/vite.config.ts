import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';
    return {
      server: {
        port: 3001,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
            secure: false,
          },
          '/storage': {
            target: apiProxyTarget,
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              ai: ['@google/genai'],
              pdf: ['jspdf'],
              icons: ['lucide-react'],
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
