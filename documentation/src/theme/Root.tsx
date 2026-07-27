/**
 * Docusaurus theme swizzle — Root wrapper (Issue #179: Web Vitals; issues
 * #361/#362: analytics consent banner)
 *
 * This component wraps the entire Docusaurus app. We use it to initialise
 * Web Vitals reporting once on the client side, and to mount the site-wide
 * analytics consent banner, without modifying the core layout.
 * See: https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
 */

import React, { useEffect, type ReactNode } from 'react';
import ConsentBanner from '@site/src/components/ConsentBanner';
import FunnelTracker from '@site/src/components/FunnelTracker';

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.JSX.Element {
  useEffect(() => {
    // Dynamic import keeps web-vitals out of the critical bundle path.
    import('../utils/webVitals').then(({ reportWebVitals }) => {
      reportWebVitals().catch(() => {
        // Silently swallow errors — vitals reporting must never break the page.
      });
    });
  }, []); // Run once on mount

  return (
    <>
      {children}
      <FunnelTracker />
      <ConsentBanner />
    </>
  );
}
