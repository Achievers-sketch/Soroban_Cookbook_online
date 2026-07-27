/**
 * Attaches non-blocking search analytics to the local search navbar input.
 * Sends query length only — never the raw search string.
 */

import { useEffect } from 'react';
import { trackSearch } from '@site/src/utils/analytics';

const SEARCH_INPUT_SELECTORS = [
  'input[type="search"]',
  '.navbar__search-input',
  '#search_input_react',
  'input[aria-label*="Search" i]',
];

function findSearchInput(): HTMLInputElement | null {
  for (const selector of SEARCH_INPUT_SELECTORS) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLInputElement) {
      return el;
    }
  }
  return null;
}

export default function SearchAnalytics(): null {
  useEffect(() => {
    let detach: (() => void) | undefined;
    let observer: MutationObserver | undefined;
    let lastTrackedKey = '';

    const attach = () => {
      const input = findSearchInput();
      if (
        !input ||
        (input as HTMLInputElement & { dataset: DOMStringMap }).dataset.analyticsBound
      ) {
        return false;
      }

      input.dataset.analyticsBound = '1';

      const fire = () => {
        const value = input.value.trim();
        if (value.length < 2) {
          return;
        }
        // Deduplicate rapid repeats of the same length bucket.
        const key = `${value.length}:${Math.floor(Date.now() / 5000)}`;
        if (key === lastTrackedKey) {
          return;
        }
        lastTrackedKey = key;
        trackSearch({ queryLength: value.length, source: 'navbar' });
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          fire();
        }
      };

      let debounceTimer: ReturnType<typeof setTimeout> | undefined;
      const onInput = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(fire, 800);
      };

      input.addEventListener('keydown', onKeyDown);
      input.addEventListener('change', fire);
      input.addEventListener('input', onInput);

      detach = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        input.removeEventListener('keydown', onKeyDown);
        input.removeEventListener('change', fire);
        input.removeEventListener('input', onInput);
        delete input.dataset.analyticsBound;
      };

      return true;
    };

    if (!attach()) {
      observer = new MutationObserver(() => {
        if (attach()) {
          observer?.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      detach?.();
    };
  }, []);

  return null;
}
