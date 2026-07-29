import React, { useEffect, useRef } from 'react';
import SearchBar from '@theme-original/SearchBar';

export default function SearchBarWrapper(props) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Find the search input within the container or fallback to the global class
        const input = containerRef.current?.querySelector('input[type="search"]') || 
                      containerRef.current?.querySelector('input.navbar__search-input') ||
                      document.querySelector('.navbar__search-input');
        
        if (input && document.activeElement === input) {
          input.blur();
        } else if (input) {
          // If focus is inside the dropdown, blur the input to force close
          input.blur();
          
          // Also try to find the clear button to trigger a close if blur isn't enough
          const clearBtn = containerRef.current?.querySelector('button[type="reset"]');
          if (clearBtn) {
             // We don't click it directly because it might clear text, but usually blurring works.
          }
        }
      }
    };

    // Use capture phase to ensure we catch it before other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <div ref={containerRef}>
      <SearchBar {...props} />
    </div>
  );
}
