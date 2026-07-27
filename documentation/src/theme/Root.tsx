import React, { useEffect, type ReactNode } from 'react';
import CookieConsent from '@site/src/components/CookieConsent/CookieConsent';
import { hasAnalyticsConsent } from '@site/src/utils/cookieConsent';

/**
 * Root wrapper: Web Vitals + cookie consent (Issue #352).
 */

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.JSX.Element {
  useEffect(() => {
    import('../utils/webVitals').then(({ reportWebVitals }) => {
      // Remote vitals beacons are non-essential; only start collectors when
      // analytics consent is present. Console-only logging still helps locally
      // when consent was accepted or during development without a remote sink.
      if (hasAnalyticsConsent() || process.env.NODE_ENV !== 'production') {
        reportWebVitals().catch(() => {
          // Vitals reporting must never break the page.
        });
      }
    });
  }, []);

  return (
    <>
      <CookieConsent />
      {children}
    </>
  );
}
