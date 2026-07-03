/**
 * Lighthouse CI Configuration
 *
 * Issue #134: Page Speed Optimization
 * Issue #122 / #189: Mobile-First Indexing Verification
 *
 * Enforces Core Web Vitals budgets:
 *   - LCP  < 2.5 s  (Good threshold per web.dev/vitals)
 *   - FCP  < 1.5 s
 *   - CLS  < 0.1
 *   - TBT  < 200 ms (proxy for INP/FID on mobile)
 *
 * Lazy-loading below-fold components (Testimonials, NewsletterSignup)
 * removes them from the critical bundle and reduces TTI.
 */

module.exports = {
  ci: {
    collect: {
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
        throttling: {
          cpuSlowdownMultiplier: 4,
        },
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/docs/',
      ],
      startServerCommand: 'cd documentation && npm run serve',
      startServerReadyPattern: 'Serving',
      startServerReadyTimeout: 60000,
    },
    assert: {
      assertions: {
        // ── Category scores ──────────────────────────────────────────────────
        'categories:performance':    ['warn', { minScore: 0.85 }],
        'categories:seo':            ['error', { minScore: 0.90 }],
        'categories:accessibility':  ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],

        // ── Core Web Vitals ───────────────────────────────────────────────────
        // LCP < 2.5 s — "Good" threshold (issue #134 success criterion)
        'largest-contentful-paint':  ['error', { maxNumericValue: 2500 }],
        // FCP < 1.5 s — "Good" threshold
        'first-contentful-paint':    ['error', { maxNumericValue: 1500 }],
        // CLS < 0.1 — "Good" threshold
        'cumulative-layout-shift':   ['error', { maxNumericValue: 0.1 }],
        // TBT < 200 ms — strong proxy for responsiveness
        'total-blocking-time':       ['warn',  { maxNumericValue: 200 }],

        // ── Mobile-specific audits ────────────────────────────────────────────
        'viewport':       'error',
        'font-size':      'error',
        'tap-targets':    'error',
        'content-width':  'error',

        // ── Resource hints ───────────────────────────────────────────────────
        'uses-text-compression':    ['warn', { minScore: 1 }],
        'render-blocking-resources': ['warn', { maxLength: 0 }],
        'uses-optimized-images':    ['warn', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
