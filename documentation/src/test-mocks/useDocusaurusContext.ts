/**
 * Vitest stub for `@docusaurus/useDocusaurusContext`.
 */
export type MockDocusaurusContext = {
  siteConfig: {
    customFields?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

let current: MockDocusaurusContext = {
  siteConfig: {
    customFields: {},
  },
};

export function __setMockDocusaurusContext(next: MockDocusaurusContext): void {
  current = next;
}

export function __resetMockDocusaurusContext(): void {
  current = { siteConfig: { customFields: {} } };
}

export default function useDocusaurusContext(): MockDocusaurusContext {
  return current;
}
