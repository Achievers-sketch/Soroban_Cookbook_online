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
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@site': path.resolve(__dirname, '.'),
      '@docusaurus/Link': path.resolve(__dirname, './vitest.setup.ts'),
      '@docusaurus/router': path.resolve(__dirname, './vitest.setup.ts'),
      '@docusaurus/Head': path.resolve(__dirname, './src/__mocks__/docusaurus-head.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, './src/__mocks__/docusaurus-useDocusaurusContext.ts'),
      '@docusaurus/plugin-content-docs/client': path.resolve(__dirname, './src/__mocks__/docusaurus-plugin-content-docs-client.ts'),
    },
  },
});
