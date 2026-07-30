import { defineConfig, configDefaults } from 'vitest/config';
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
    // Drop Playwright e2e specs (run separately via `bun run e2e`) and the
    // bun-only `sanitizeUrl.test.ts` so vitest doesn't try to load them.
    // configDefaults.exclude already covers node_modules / .git / build.
    exclude: [...configDefaults.exclude, 'e2e/**', '**/sanitizeUrl.test.ts'],
    coverage: {
      // v8 coverage is faster to instrument than istanbul and is the
      // recommended provider for Vitest 1.x.
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      // Only track our own source — exclude test files, the @docusaurus
      // theme shim (no logic worth measuring), type declarations, and
      // the mutable router mock used by component tests.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        '__mocks__/**',
        'src/**/*.d.ts',
        // Theme wrappers are swizzled Docusaurus plumbing — measuring
        // coverage there just obscures our own code-coverage signal.
        'src/theme/**',
      ],
      // Per-glob thresholds so each module gets a fair baseline. These
      // numbers are intentionally generous for day one — tighten them
      // in a follow-up once the baseline is confirmed.
      thresholds: {
        'src/components/SearchFilters/SearchFilters.tsx': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80,
        },
        'src/components/SearchAnalytics/SearchAnalytics.tsx': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80,
        },
        'src/utils/searchFilterUtils.ts': {
          lines: 95,
          statements: 95,
          functions: 95,
          branches: 90,
        },
      },
    },
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
      '@docusaurus/router': path.resolve(__dirname, './__mocks__/docusaurus-router.ts'),
    },
  },
});
