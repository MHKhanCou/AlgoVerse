import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PublicCodeforcesAnalyzer from '../PublicCodeforcesAnalyzer';

const profile = (handle) => ({
  handle,
  avatar: `https://example.com/${handle}.png`,
  rank: 'expert',
  rating: 1600,
  maxRating: 1800,
});

// Records every CF API URL the component requests so duplicate fetches are visible.
const stubCodeforcesFetch = ({ failStatus = false } = {}) => {
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      calls.push(url);
      if (url.includes('user.info')) {
        if (url.includes('handles=missing')) {
          return {
            json: async () => ({
              status: 'FAILED',
              comment: 'handles: User with handle missing not found',
            }),
          };
        }
        const handle = decodeURIComponent(url.split('handles=')[1]);
        return { json: async () => ({ status: 'OK', result: [profile(handle)] }) };
      }
      if (url.includes('user.status')) {
        return failStatus
          ? { json: async () => ({ status: 'FAILED', comment: 'Call limit exceeded' }) }
          : { json: async () => ({ status: 'OK', result: [] }) };
      }
      if (url.includes('user.rating')) {
        return { json: async () => ({ status: 'OK', result: [] }) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
  return calls;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PublicCodeforcesAnalyzer deep-link and failure states', () => {
  it('fetches a single deep-linked handle exactly once', async () => {
    const calls = stubCodeforcesFetch();
    const { container } = render(<PublicCodeforcesAnalyzer initialHandles={['tourist']} />);

    await waitFor(() => expect(container.querySelector('.cf-user-card')).toBeTruthy());
    // Give a duplicate mount effect a chance to fire before counting.
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(calls.filter((url) => url.includes('user.info')).length).toBe(1);
    expect(calls.filter((url) => url.includes('user.status')).length).toBe(1);
  });

  it('shows only the comparison table when several handles are deep-linked', async () => {
    const calls = stubCodeforcesFetch();
    const { container } = render(
      <PublicCodeforcesAnalyzer initialHandles={['alice', 'bob']} />,
    );

    await waitFor(() => expect(container.querySelectorAll('.cf-comparison-row').length).toBe(2));

    expect(container.querySelector('.cf-user-card')).toBeNull();
    expect(container.querySelector('.cf-empty-state')).toBeNull();
    // One user.info + one user.status per compared handle, no extra single-user fetch.
    expect(calls.filter((url) => url.includes('user.info')).length).toBe(2);
    expect(calls.filter((url) => url.includes('user.status')).length).toBe(2);
    expect(calls.filter((url) => url.includes('user.rating')).length).toBe(0);
  });

  it('renders a dash for comparison stats that are missing', async () => {
    stubCodeforcesFetch({ failStatus: true });
    const { container } = render(
      <PublicCodeforcesAnalyzer initialHandles={['alice', 'bob']} />,
    );

    await waitFor(() => expect(container.querySelectorAll('.cf-comparison-row').length).toBe(2));

    const failedCells = [...container.querySelectorAll('.cf-comparison-stat')].map(
      (cell) => cell.textContent,
    );
    expect(failedCells.every((text) => text === '—')).toBe(true);
  });

  it('shows a friendly not-found error instead of raw API text', async () => {
    stubCodeforcesFetch();
    const { container } = render(<PublicCodeforcesAnalyzer initialHandles={['missing']} />);

    await waitFor(() =>
      expect(screen.getByText('Codeforces user "missing" was not found.')).toBeTruthy(),
    );
    expect(container.querySelector('.cf-user-card')).toBeNull();
    expect(container.querySelector('.cf-stats-grid')).toBeNull();
  });

  it('renders an explicit statistics-unavailable state when submissions fail', async () => {
    stubCodeforcesFetch({ failStatus: true });
    const { container } = render(<PublicCodeforcesAnalyzer initialHandles={['tourist']} />);

    await waitFor(() => expect(container.querySelector('.cf-stats-unavailable')).toBeTruthy());
    expect(container.querySelector('.cf-stats-grid')).toBeNull();
    expect(container.querySelector('.cf-stat-card')).toBeNull();
  });
});
