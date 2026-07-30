/**
 * Docusaurus theme swizzle — Root wrapper (Issue #179: Web Vitals; issues
 * #361/#362: analytics consent banner; issue #358: search analytics;
 * issue #352: privacy / GDPR consent gating for non-essential beacons)
 *
 * This component wraps the entire Docusaurus app. We use it to initialise
 * Web Vitals reporting once on the client side, and to mount the site-wide
 * analytics consent banner and route-level trackers, without modifying the
 * core layout.
 * See: https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
 */

import React, { useEffect, type ReactNode } from 'react';
import ConsentBanner from '@site/src/components/ConsentBanner';
import FunnelTracker from '@site/src/components/FunnelTracker';
import SearchAnalytics from '@site/src/components/SearchAnalytics';
import { hasConsent } from '@site/src/utils/analyticsConsent';
import useRecommendationTracker from '../hooks/useRecommendationTracker';

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.JSX.Element {
  useRecommendationTracker();

  useEffect(() => {
    import('../utils/webVitals').then(({ reportWebVitals }) => {
      // Remote vitals beacons are non-essential; only start collectors when
      // analytics consent is present. Console-only logging still helps locally
      // when consent was accepted or during development without a remote sink.
      if (hasConsent() || process.env.NODE_ENV !== 'production') {
        reportWebVitals().catch(() => {
          // Vitals reporting must never break the page.
        });
      }
    });
  }, []);

  return (
    <>
      {children}
      <FunnelTracker />
      <SearchAnalytics />
      <ConsentBanner />
    </>
  );
}
