/**
 * Docusaurus theme swizzle — Root wrapper (Issue #179: Web Vitals)
 *
 * This component wraps the entire Docusaurus app. We use it to initialise
 * Web Vitals reporting once on the client side without modifying the core
 * layout. See: https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
 */

import React, { useEffect, type ReactNode } from 'react';

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

  return <>{children}</>;
}
