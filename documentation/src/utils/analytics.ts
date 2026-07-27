/**
 * Consent-gated loaders for GA4 (conversion funnel tracking, issue #362) and
 * Microsoft Clarity (heatmaps/session replay, issue #361). Neither script is
 * injected until `initAnalytics` is called with a granted consent — see
 * ConsentBanner, which calls this on mount (if consent was already granted in
 * a previous session) and again the moment the visitor clicks "Accept".
 *
 * CSP note: injecting these scripts requires `https://www.googletagmanager.com`
 * and `https://www.clarity.ms` to be allowlisted in `script-src`. Kept in sync
 * across docusaurus.config.ts, vercel.json, and static/_headers — see
 * DEPLOYMENT.md → Analytics.
 */

type ClarityFn = { (...args: unknown[]): void; q?: unknown[] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ClarityFn;
  }
}

export interface AnalyticsIds {
  gaMeasurementId?: string;
  clarityProjectId?: string;
}

let loaded = false;

function loadGA4(measurementId: string): void {
  if (document.getElementById('ga4-gtag-src')) return;

  const script = document.createElement('script');
  script.id = 'ga4-gtag-src';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  // anonymize_ip: no IP-level PII is retained, matching the privacy-first
  // requirement from issue #361's "privacy-compliant" evaluation criteria.
  window.gtag('config', measurementId, { anonymize_ip: true });
}

function loadClarity(projectId: string): void {
  if (document.getElementById('ms-clarity-src')) return;

  // Queue calls made before the real tag finishes loading; clarity.ms drains
  // `clarity.q` on init.
  const stub: ClarityFn = (...args: unknown[]) => {
    (stub.q = stub.q ?? []).push(args);
  };
  window.clarity = window.clarity ?? stub;

  const script = document.createElement('script');
  script.id = 'ms-clarity-src';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.appendChild(script);
}

/** Injects GA4/Clarity for whichever IDs are configured. No-op if called twice. */
export function initAnalytics({ gaMeasurementId, clarityProjectId }: AnalyticsIds): void {
  if (typeof window === 'undefined' || loaded) return;
  if (!gaMeasurementId && !clarityProjectId) return;

  loaded = true;
  if (gaMeasurementId) loadGA4(gaMeasurementId);
  if (clarityProjectId) loadClarity(clarityProjectId);
}

/**
 * Fires a GA4 event for funnel analysis (issue #362). Safe to call even when
 * analytics hasn't loaded (consent denied, or IDs unset) — it's just a no-op.
 */
export function trackEvent(name: string, params: Record<string, string> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}

/**
 * Ordered steps of the landing → docs → GitHub conversion funnel (issue #362).
 * Build the GA4 funnel exploration from these event names in order; see
 * DEPLOYMENT.md → Analytics for the report setup.
 */
export const FUNNEL_STEPS = {
  landingView: 'funnel_landing_view',
  ctaClick: 'funnel_cta_click',
  docsView: 'funnel_docs_view',
  githubClick: 'funnel_github_click',
} as const;

/** Records a homepage CTA click, labelled so GA4 can break the step down by button. */
export function trackCtaClick(ctaId: string, destination: string): void {
  trackEvent(FUNNEL_STEPS.ctaClick, { cta_id: ctaId, destination });
}
