/**
 * Utility functions for CodeSnippet component
 * Handles comment filtering and code manipulation
 */

/**
 * Remove comment-only lines from code
 * Preserves inline comments that appear after code
 * Only removes lines where // is the first non-whitespace character
 */
export function stripComments(code: string): string {
  return code
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Keep line if it's not empty and doesn't start with //
      return trimmed.length === 0 || !trimmed.startsWith('//');
    })
    .join('\n');
}

/**
 * Check if code has any comment-only lines
 * Used to determine if toggle button should be visible
 */
export function hasCommentLines(code: string): boolean {
  return code.split('\n').some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') && trimmed.length > 2;
  });
}

/**
 * Get the display code based on showComments flag
 */
export function getDisplayCode(code: string, showComments: boolean): string {
  return showComments ? code : stripComments(code);
}
