import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './app'),
      '@/data': path.resolve(__dirname, './data'),
      '@/components': path.resolve(__dirname, './components'),
      '@/store': path.resolve(__dirname, './store'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
