import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver (needed for components like Stats)
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame and cancelAnimationFrame (needed for stats/counters animations)
window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  cb(Date.now());
  return 1;
});
window.cancelAnimationFrame = vi.fn();
