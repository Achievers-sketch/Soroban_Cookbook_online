/**
 * Lighthouse CI Configuration
 * ROADMAP-122 / Issue #189: Mobile-First Indexing Verification
 *
 * Intended to run from the documentation/ directory (CI working-directory).
 */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './build',
      numberOfRuns: 1,
      settings: {
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
      url: ['/', '/docs/'],
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        viewport: 'error',
        'font-size': 'warn',
        'tap-targets': 'warn',
        'content-width': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};