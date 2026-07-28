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
    include: ['src/**/*.test.{ts,tsx}'],
    // Exclude Bun-specific unit tests (e.g. those using bun:test) from the Vitest runner
    exclude: ['src/utils/__tests__/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@site': path.resolve(__dirname, '.'),
      '@docusaurus/Link': path.resolve(__dirname, './src/__mocks__/@docusaurus/Link.tsx'),
      '@theme/Layout': path.resolve(__dirname, './src/__mocks__/@theme/Layout.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, './src/__mocks__/@docusaurus/useDocusaurusContext.tsx'),
      '@docusaurus/router': path.resolve(__dirname, './src/__mocks__/@docusaurus/router.tsx'),
      '@docusaurus/theme-common': path.resolve(__dirname, './src/__mocks__/@docusaurus/theme-common.tsx'),
    },
  },
});
