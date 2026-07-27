/**
 * Docusaurus theme swizzle — Root wrapper
 *
 * - Issue #179: Web Vitals reporting
 * - Issue #356: Search analytics listener
 */

import React, { useEffect, type ReactNode } from 'react';
import SearchAnalytics from '@site/src/components/SearchAnalytics/SearchAnalytics';

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
      <SearchAnalytics />
      {children}
    </>
  );
}
