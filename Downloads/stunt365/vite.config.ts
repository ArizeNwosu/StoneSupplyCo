import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3010,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      define: {
        // Expose GEMINI_API_KEY (without VITE_ prefix) for environments that set it that way
        // AND support VITE_GEMINI_API_KEY for standard Vite .env usage
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
          env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''
        ),
      },
    };
});
