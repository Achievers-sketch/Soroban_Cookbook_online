import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const docusaurusAlias = (name) =>
  path.resolve(
    __dirname,
    `node_modules/@docusaurus/core/lib/client/exports/${name}`,
  );

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
    exclude: [...configDefaults.exclude, 'e2e/**', '**/sanitizeUrl.test.ts', 'src/utils/__tests__/**'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        '__mocks__/**',
        'src/**/*.d.ts',
        'src/theme/**',
      ],
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
      '@site': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './src'),
      '@site': path.resolve(__dirname, '.'),
      '@docusaurus/Link': path.resolve(__dirname, './vitest.setup.ts'),
      '@docusaurus/router': path.resolve(__dirname, './vitest.setup.ts'),
      '@docusaurus/Head': path.resolve(__dirname, './src/__mocks__/docusaurus-head.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, './src/__mocks__/docusaurus-useDocusaurusContext.ts'),
      '@docusaurus/plugin-content-docs/client': path.resolve(__dirname, './src/__mocks__/docusaurus-plugin-content-docs-client.ts'),
      '@docusaurus/router': path.resolve(__dirname, './__mocks__/docusaurus-router.ts'),
      // Docusaurus re-exports (resolved through @docusaurus/core)
      '@docusaurus/useDocusaurusContext': docusaurusAlias('useDocusaurusContext'),
      '@docusaurus/useIsBrowser': docusaurusAlias('useIsBrowser'),
      '@docusaurus/useBaseUrl': docusaurusAlias('useBaseUrl'),
      '@docusaurus/useGlobalData': docusaurusAlias('useGlobalData'),
      '@docusaurus/useRouteContext': docusaurusAlias('useRouteContext'),
      '@docusaurus/isInternalUrl': docusaurusAlias('isInternalUrl'),
      '@docusaurus/ExecutionEnvironment': docusaurusAlias('ExecutionEnvironment'),
      '@docusaurus/BrowserOnly': docusaurusAlias('BrowserOnly'),
      '@docusaurus/ComponentCreator': docusaurusAlias('ComponentCreator'),
      '@docusaurus/constants': docusaurusAlias('constants'),
      '@docusaurus/docusaurusContext': docusaurusAlias('docusaurusContext'),
      '@docusaurus/Head': docusaurusAlias('Head'),
      '@docusaurus/Interpolate': docusaurusAlias('Interpolate'),
      '@docusaurus/ErrorBoundary': docusaurusAlias('ErrorBoundary'),
      '@docusaurus/Link': docusaurusAlias('Link'),
      '@docusaurus/Noop': docusaurusAlias('Noop'),
      '@docusaurus/renderRoutes': docusaurusAlias('renderRoutes'),
      '@docusaurus/Translate': docusaurusAlias('Translate'),
      '@docusaurus/router': docusaurusAlias('router'),
      '@docusaurus/routes': docusaurusAlias('routes'),
      '@docusaurus/routeConfig': docusaurusAlias('routeConfig'),
      '@docusaurus/RouteContext': docusaurusAlias('RouteContext'),
      '@docusaurus/serverEntry': docusaurusAlias('serverEntry.js'),
      '@docusaurus/useHistory': docusaurusAlias('useHistory'),
      '@docusaurus/useLocation': docusaurusAlias('useLocation'),
      '@docusaurus/Link': path.resolve(__dirname, './src/__mocks__/@docusaurus/Link.tsx'),
      '@theme/Layout': path.resolve(__dirname, './src/__mocks__/@theme/Layout.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, './src/__mocks__/@docusaurus/useDocusaurusContext.tsx'),
      '@docusaurus/router': path.resolve(__dirname, './src/__mocks__/@docusaurus/router.tsx'),
      '@docusaurus/theme-common': path.resolve(__dirname, './src/__mocks__/@docusaurus/theme-common.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(
        __dirname,
        './src/test-mocks/useDocusaurusContext.ts',
      ),
    },
  },
});
