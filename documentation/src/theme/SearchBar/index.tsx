import React, { useState, useEffect, useRef } from 'react';
import OriginalSearchBar from '@theme-original/SearchBar';
import type SearchBarType from '@theme/SearchBar';
import type { WrapperProps } from '@docusaurus/types';
import styles from './styles.module.css';

type Props = WrapperProps<typeof SearchBarType>;

const STORAGE_KEY = 'soroban_search_history';
const MAX_HISTORY = 5;

export default function SearchBarWrapper(props: Props): JSX.Element {
  const [history, setHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load search history', e);
    }
  }, []);

  // Save history to localStorage
  const saveQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search history', e);
      }
      return updated;
    });
  };

  // Find the input element inside the original search bar
  useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.querySelector('input');
      if (input) {
        inputRef.current = input;

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            saveQuery(input.value);
            setIsOpen(false);
          }
        };

        const handleFocus = () => {
          setIsOpen(true);
        };

        input.addEventListener('keydown', handleKeyDown);
        input.addEventListener('focus', handleFocus);

        return () => {
          input.removeEventListener('keydown', handleKeyDown);
          input.removeEventListener('focus', handleFocus);
        };
      }
    }
  }, [containerRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectHistory = (query: string) => {
    if (inputRef.current) {
      inputRef.current.value = query;
      // Focus input
      inputRef.current.focus();
      // Dispatch input event to trigger Docusaurus search plugin
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
      
      // Also save query to move it to the top of the history
      saveQuery(query);
    }
    setIsOpen(false);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear search history', e);
    }
  };

  return (
    <div ref={containerRef} className={styles.searchBarContainer}>
      <OriginalSearchBar {...props} />
      {isOpen && history.length > 0 && (
        <div className={styles.historyDropdown}>
          <div className={styles.historyHeader}>
            <span>Recent Searches</span>
            <button className={styles.clearButton} onClick={handleClearHistory}>
              Clear
            </button>
          </div>
          <ul className={styles.historyList}>
            {history.map((item, index) => (
              <li
                key={index}
                className={styles.historyItem}
                onClick={() => handleSelectHistory(item)}
              >
                <svg
                  className={styles.clockIcon}
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className={styles.historyText}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
import React, { useEffect, useRef } from 'react';
import SearchBar from '@theme-original/SearchBar';

export default function SearchBarWrapper(props: Record<string, unknown>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find the search input within the container or fallback to the global class
        const input = (containerRef.current?.querySelector('input[type="search"]') ||
          containerRef.current?.querySelector('input.navbar__search-input') ||
          document.querySelector('.navbar__search-input')) as HTMLElement | null;

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
