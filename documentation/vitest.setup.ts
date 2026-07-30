import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@docusaurus/Link', () => {
  return {
    default: ({ to, children, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
  };
});

vi.mock('@docusaurus/router', () => {
  return {
    useLocation: () => ({ pathname: '/' }),
  };
});

vi.mock('@docusaurus/Head', () => {
  return {
    default: (props: any) => React.createElement('head', null, props?.children),
  };
});

vi.mock('@docusaurus/useDocusaurusContext', () => {
  return {
    default: () => ({
      siteConfig: {
        url: 'https://soroban-cookbook.dev',
        baseUrl: '/',
      },
    }),
  };
});

vi.mock('@docusaurus/plugin-content-docs/client', () => {
  return {
    useSidebarBreadcrumbs: () => [],
    useDoc: () => ({
      metadata: {
        title: 'Doc',
        permalink: '/docs/doc',
      },
    }),
  };
});
