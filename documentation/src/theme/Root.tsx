/**
 * Docusaurus theme swizzle — Root wrapper
 *
 * Issue #136: Error Monitoring Setup (Sentry)
 * Issue #179: Web Vitals reporting
 *
 * Initialises both Sentry (error monitoring) and Web Vitals reporting once
 * on the client side. Neither must ever break the page render — all SDK
 * calls are wrapped in try/catch or silent-swallow promise chains.
 *
 * ## Sentry configuration
 *
 * Required env vars (set at build time via your CI/CD or .env.local):
 *   SENTRY_DSN          – Project DSN from Sentry dashboard → Settings → SDK Setup
 *
 * Optional env vars:
 *   SENTRY_ENVIRONMENT  – e.g. "production" | "preview" | "development"
 *                         defaults to process.env.NODE_ENV
 *   SENTRY_RELEASE      – Semantic version string, e.g. "1.4.2"
 *                         defaults to npm_package_version
 *
 * Example (Vercel):
 *   Add SENTRY_DSN in Vercel Dashboard → Settings → Environment Variables
 *
 * Example (GitHub Actions):
 *   Add SENTRY_DSN as a repository secret, then expose it in the workflow:
 *   env:
 *     SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
 *
 * When SENTRY_DSN is absent (local dev without a configured project), Sentry
 * is NOT initialised — the page behaves exactly as before this change.
 *
 * ## Testing that errors reach Sentry
 *
 * In a browser console on a Sentry-connected build:
 *   window.__sentryTest()
 * This fires a test error that should appear in your Sentry dashboard within
 * a few seconds.
 *
 * See: https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
 */

import React, { useEffect, type ReactNode } from 'react';

// Build-time constants injected by Docusaurus / webpack DefinePlugin.
// process.env is statically replaced at build time; these are safe to read
// in a browser bundle.
const SENTRY_DSN: string =
  (typeof process !== 'undefined' && process.env.SENTRY_DSN) || '';
const SENTRY_ENVIRONMENT: string =
  (typeof process !== 'undefined' &&
    (process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV)) ||
  'production';
const SENTRY_RELEASE: string =
  (typeof process !== 'undefined' &&
    (process.env.SENTRY_RELEASE || process.env.npm_package_version)) ||
  'unknown';

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.JSX.Element {
  useEffect(() => {
    // ── Sentry initialisation ──────────────────────────────────────────────
    // Only initialise when a DSN is configured. This keeps local development
    // clean and avoids noisy "no DSN provided" console warnings.
    if (SENTRY_DSN) {
      import('@sentry/react')
        .then((Sentry) => {
          Sentry.init({
            dsn: SENTRY_DSN,
            environment: SENTRY_ENVIRONMENT,
            release: SENTRY_RELEASE,

            // Capture 100 % of errors in production; tune down if volume is
            // high once the project is live.
            sampleRate: 1.0,

            // Performance tracing — capture 10 % of transactions by default.
            // Increase to 1.0 during initial rollout to get a baseline, then
            // dial back to reduce quota usage.
            tracesSampleRate: 0.1,

            // Ignore common browser extension noise and benign network errors.
            ignoreErrors: [
              // Browser extension messaging
              'ResizeObserver loop limit exceeded',
              'ResizeObserver loop completed with undelivered notifications',
              // Chrome extension noise
              /chrome-extension:\/\//,
              /extensions\//,
              // Network errors that aren't actionable
              'NetworkError',
              'Failed to fetch',
              'Load failed',
            ],

            // Strip user PII from breadcrumbs and event data.
            beforeSend(event) {
              // Remove any query-string parameters that might contain tokens
              if (event.request?.url) {
                try {
                  const url = new URL(event.request.url);
                  // Scrub common sensitive query params
                  ['token', 'key', 'secret', 'password', 'auth'].forEach((p) =>
                    url.searchParams.delete(p),
                  );
                  event.request.url = url.toString();
                } catch {
                  // URL parsing failed — leave as-is
                }
              }
              return event;
            },
          });

          // Expose a test helper on window so the Sentry integration can be
          // verified without a real user-facing error:
          //   window.__sentryTest()
          if (typeof window !== 'undefined') {
            (
              window as Window & { __sentryTest?: () => void }
            ).__sentryTest = () => {
              Sentry.captureException(
                new Error(
                  '[Sentry test] Manual verification — safe to ignore in production.',
                ),
              );
            };
          }
        })
        .catch(() => {
          // Sentry failed to load (network issue, ad-blocker, etc.).
          // Silently swallow — error monitoring must never break the page.
        });
    }

    // ── Web Vitals reporting ───────────────────────────────────────────────
    // Dynamic import keeps web-vitals out of the critical bundle path.
    import('../utils/webVitals')
      .then(({ reportWebVitals }) => {
        reportWebVitals().catch(() => {
          // Silently swallow errors — vitals reporting must never break the page.
        });
      })
      .catch(() => {
        // Ignore if the module fails to load.
      });
  }, []); // Run once on mount

  return <>{children}</>;
}
