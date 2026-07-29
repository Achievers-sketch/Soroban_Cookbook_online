import React, { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import styles from './CodeSnippet.module.css';
import { CodeSnippetProps } from './types';
import { hasCommentLines, getDisplayCode, downloadFile, formatFilename } from './utils';

/**
 * CodeSnippet Component
 * 
 * Renders code with optional toggle to hide/show detailed comments and download button.
 * Comments are identified as lines starting with // (after whitespace).
 * 
 * @example
 * ```tsx
 * <CodeSnippet
 *   code={myRustCode}
 *   language="rust"
 *   defaultShowComments={false}
 *   filename="hello-world"
 *   showDownload={true}
 * />
 * ```
 */
export default function CodeSnippet({
  code,
  language = 'rust',
  defaultShowComments = true,
  className,
  onCommentToggle,
  filename,
  showDownload = true,
}: CodeSnippetProps) {
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading'>('idle');

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

  // Generate the file to download (use full code, not filtered code)
  const handleDownload = useCallback(() => {
    try {
      setDownloadStatus('downloading');
      
      // Use provided filename or generate one
      const finalFilename = filename 
        ? formatFilename(filename, language)
        : formatFilename(`code-${Date.now()}`, language);

      downloadFile(code, finalFilename);
      
      // Reset status after a brief moment
      setTimeout(() => setDownloadStatus('idle'), 500);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('idle');
    }
  }, [code, filename, language]);

  if (!hasComments) {
    // If no comments, render plain code block with download button
    return (
      <div className={clsx(styles.wrapper, className)}>
        <div className={styles.header}>
          {showDownload && (
            <button
              className={styles.downloadButton}
              onClick={handleDownload}
              disabled={downloadStatus === 'downloading'}
              aria-label={`Download code as ${formatFilename(filename || 'code', language)}`}
              title={`Download as ${formatFilename(filename || 'code', language)}`}>
              <span className={styles.icon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              <span>Download</span>
            </button>
          )}
        </div>
        <div className={styles.codeBlock}>
          <code>{code}</code>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.wrapper, className)}>
      {/* Header with toggle and download buttons */}
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

        {showDownload && (
          <button
            className={styles.downloadButton}
            onClick={handleDownload}
            disabled={downloadStatus === 'downloading'}
            aria-label={`Download code as ${formatFilename(filename || 'code', language)}`}
            title={`Download as ${formatFilename(filename || 'code', language)}`}>
            <span className={styles.icon}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <span>Download</span>
          </button>
        )}
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
