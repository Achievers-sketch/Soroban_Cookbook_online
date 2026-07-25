/**
 * Lighthouse CI Configuration
 * ROADMAP-122 / Issue #189: Mobile-First Indexing Verification
 *
 * Runs Lighthouse audits on mobile viewport to verify:
 * - SEO score >= 90
 * - Accessibility score >= 90
 * - Best Practices score >= 90
 * - No mobile usability issues
 *
 * Intended to run from the documentation/ directory (CI working-directory).
 */

module.exports = {
  ci: {
    collect: {
      // Serve the already-built Docusaurus output (no nested cd documentation)
      staticDistDir: './build',
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        emulatedFormFactor: 'mobile',
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
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.8 }],
        viewport: 'error',
        'font-size': 'error',
        'tap-targets': 'warn',
        'content-width': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};