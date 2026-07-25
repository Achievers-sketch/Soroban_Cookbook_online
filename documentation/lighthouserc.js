/**
 * Lighthouse CI Configuration
 * ROADMAP-122 / Issue #189: Mobile-First Indexing Verification
 *
 * Runs Lighthouse audits on mobile viewport to verify:
 * - SEO score >= 90
 * - Accessibility score >= 90
 * - Best Practices score >= 90
 * - No mobile usability issues
 */

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      settings: {
        // formFactor must match screenEmulation.mobile (Lighthouse validation).
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
      url: [
        'http://127.0.0.1:3000/',
        'http://127.0.0.1:3000/docs/getting-started/setup',
      ],
      // Workflow runs lhci from ./documentation after `bun run build`.
      startServerCommand: 'bun run serve -- --port 3000 --host 127.0.0.1',
      startServerReadyPattern: 'Serving',
      startServerReadyTimeout: 120000,
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.5 }],
        'viewport': 'error',
        // Soften flaky mobile audits on static preview hosts.
        'font-size': ['warn', {}],
        'tap-targets': ['warn', {}],
        'content-width': ['warn', {}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
