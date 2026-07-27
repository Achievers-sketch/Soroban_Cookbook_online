/**
 * Lightweight GA4 / gtag analytics helpers.
 *
 * Events are sent only when `window.gtag` or `window.dataLayer` is available
 * (e.g. after Docusaurus gtag is configured via GTAG_MEASUREMENT_ID).
 * Failures are swallowed so analytics never blocks UI interactions.
 *
 * See docs: contributing/analytics-events.md
 */

export const ANALYTICS_EVENTS = {
  SEARCH: 'search',
  COPY_CODE: 'copy_code',
  NEWSLETTER_SUBMIT: 'newsletter_submit',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Fire a custom analytics event. Safe to call during SSR and when GA is absent.
 */
export function trackEvent(
  eventName: AnalyticsEventName | string,
  params: AnalyticsParams = {},
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cleaned: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, cleaned);
    }

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...cleaned });
    }
  } catch {
    // Analytics must never break the application.
  }
}

/** Track a site search without sending the raw query (avoids unnecessary PII). */
export function trackSearch(options: {
  queryLength: number;
  resultCount?: number;
  source?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.SEARCH, {
    query_length: Math.max(0, Math.floor(options.queryLength)),
    result_count: options.resultCount,
    search_source: options.source ?? 'navbar',
  });
}

/** Track a successful code copy. */
export function trackCopyCode(options: { language?: string; section?: string }): void {
  trackEvent(ANALYTICS_EVENTS.COPY_CODE, {
    code_language: options.language ?? 'unknown',
    code_section: options.section ?? 'code_block',
  });
}

/** Track newsletter submission reaching the intended success state. */
export function trackNewsletterSubmit(
  options: {
    method?: 'endpoint' | 'demo';
  } = {},
): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBMIT, {
    submission_status: 'success',
    submission_method: options.method ?? 'endpoint',
  });
}
