import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import NewsletterSignup from './NewsletterSignup';

vi.mock('@docusaurus/useDocusaurusContext', () => ({
  default: () => ({
    siteConfig: {
      customFields: {
        newsletterEndpoint: undefined,
      },
    },
  }),
}));

describe('NewsletterSignup', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the signup form with heading, input, and button', () => {
    render(<NewsletterSignup />);
    expect(screen.getByRole('heading', { name: /stay in the loop/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('shows required error when submitting an empty email', () => {
    render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /email address/i });

    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email address.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows format error when submitting an invalid email', () => {
    render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /email address/i });

    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows success and clears the input on valid submission', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /email address/i });
    const button = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(input, { target: { value: 'user@example.com' } });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Subscribing…');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/thanks.*you are on the list/i);
    });
    expect(input).toHaveValue('');
  });

  it('clears the error when the user starts typing again', () => {
    render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /email address/i });

    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'a' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('connects aria-describedby to the error message when validation fails', () => {
    render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /email address/i });

    expect(input).not.toHaveAttribute('aria-describedby');

    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('Enter an email address.');
  });
});
