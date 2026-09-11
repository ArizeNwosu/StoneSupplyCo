import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/main.tsx'),
        name: 'CyberLockChallenge',
        formats: ['iife'],
        fileName: () => 'lock-challenge',
      },
      rollupOptions: {
        output: {
          entryFileNames: 'lock-challenge.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'lock-challenge.css';
            return assetInfo.name ?? '[name][extname]';
          },
        },
      },
      outDir: path.resolve(__dirname, '../assets'),
      emptyOutDir: false,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
