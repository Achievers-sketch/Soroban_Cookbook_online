import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import styles from './CodeSnippet.module.css';
import { CodeSnippetProps } from './types';
import { hasCommentLines, getDisplayCode } from './utils';

/**
 * CodeSnippet Component
 * 
 * Renders code with optional toggle to hide/show detailed comments.
 * Comments are identified as lines starting with // (after whitespace).
 * 
 * @example
 * ```tsx
 * <CodeSnippet
 *   code={myRustCode}
 *   language="rust"
 *   defaultShowComments={false}
 * />
 * ```
 */
export default function CodeSnippet({
  code,
  language = 'rust',
  defaultShowComments = true,
  className,
  onCommentToggle,
}: CodeSnippetProps) {
  const [showComments, setShowComments] = useState(defaultShowComments);

  // Check if code has comment-only lines
  const hasComments = useMemo(() => hasCommentLines(code), [code]);

  // Get the display code based on current state
  const displayCode = useMemo(
    () => getDisplayCode(code, showComments),
    [code, showComments],
  );

  const handleToggle = () => {
    const newState = !showComments;
    setShowComments(newState);
    onCommentToggle?.(newState);
  };

  if (!hasComments) {
    // If no comments, render plain code block
    return (
      <div className={clsx(styles.wrapper, className)}>
        <div className={styles.codeBlock}>
          <code>{code}</code>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.wrapper, className)}>
      {/* Header with toggle button */}
      <div className={styles.header}>
        <button
          className={clsx(styles.toggleButton, !showComments && styles.hidden)}
          onClick={handleToggle}
          aria-label={showComments ? 'Hide comments' : 'Show comments'}
          title={showComments ? 'Hide detailed comments' : 'Show detailed comments'}>
          <span className={styles.icon}>
            {showComments ? (
              // Eye icon (showing)
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              // Eye off icon (hiding)
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </span>
          <span>{showComments ? 'Hide' : 'Show'} comments</span>
        </button>
      </div>

      {/* Status indicator */}
      {!showComments && (
        <div className={clsx(styles.commentStatus, !showComments && styles.hidden)}>
          Detailed comments hidden
        </div>
      )}

      {/* Code block */}
      <div className={styles.codeBlock}>
        <code>{displayCode}</code>
      </div>
    </div>
  );
}
