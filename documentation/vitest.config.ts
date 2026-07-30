import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@docusaurus/Link': path.resolve(__dirname, './vitest.setup.ts'),
      '@docusaurus/router': path.resolve(__dirname, './vitest.setup.ts'),
    },
  },
});
