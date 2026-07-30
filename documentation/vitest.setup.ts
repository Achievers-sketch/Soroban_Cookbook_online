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

