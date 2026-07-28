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
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'e2e/**', 'build/**', 'src/utils/__tests__/sanitizeUrl.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@site': path.resolve(__dirname, '.'),
      '@docusaurus/useDocusaurusContext': path.resolve(
        __dirname,
        './src/test-mocks/useDocusaurusContext.ts',
      ),
    },
  },
});
