import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  __setMockDocusaurusContext,
  __resetMockDocusaurusContext,
} from '../../test-mocks/useDocusaurusContext';

vi.mock('../../utils/csrf', () => ({
  getOrCreateCSRFToken: () => 'test-csrf-token',
  clearCSRFToken: vi.fn(),
  updateCSRFTokenFromResponse: vi.fn(),
}));

import NewsletterSignup from './NewsletterSignup';

describe('NewsletterSignup error states (#348)', () => {
  beforeEach(() => {
    __setMockDocusaurusContext({
      siteConfig: {
        customFields: {
          newsletterEndpoint: 'https://example.com/api/subscribe',
        },
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
      }),
    );
  });

  afterEach(() => {
    __resetMockDocusaurusContext();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows an alert when the email is empty', async () => {
    render(<NewsletterSignup />);

    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/enter an email address/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows an alert when the email is invalid', async () => {
    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/valid email address/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows a graceful error when the subscribe endpoint returns 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: { get: () => null },
      }),
    );

    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'tester@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/something went wrong/i);
  });

  it('shows a graceful error when the network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'tester@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/something went wrong/i);
  });

  it('shows success status when the endpoint accepts the subscription', async () => {
    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'tester@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/thanks/i);
    });
  });
});
