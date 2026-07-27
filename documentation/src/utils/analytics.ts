/**
 * Consent-aware analytics helpers.
 * Non-essential events and GA4 loading require analytics consent.
 */

import { hasAnalyticsConsent } from './cookieConsent';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __sorobanGtagLoaded?: boolean;
  }
}

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) {
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

/**
 * Load GA4 gtag only after analytics consent. Safe to call repeatedly.
 */
export function loadGoogleAnalytics(measurementId: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  if (!measurementId || !hasAnalyticsConsent()) {
    return;
  }
  if (window.__sorobanGtagLoaded) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  window.__sorobanGtagLoaded = true;
}
