import { defineConfig } from 'vitest/config';
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@site': path.resolve(__dirname, '.'),

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
    },
  },
});
