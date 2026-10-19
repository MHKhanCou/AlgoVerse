import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContestTracker from '../ContestTracker';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));

const baseResponse = (overrides = {}) => ({
  data: {
    status: 'success',
    running: [],
    upcoming: [],
    recent: [],
    counts: { total: 0 },
    fetched_at: new Date().toISOString(),
    cached: false,
    ...overrides,
  },
});

const contest = (name, site, startOffsetMs, duration = 7200) => ({
  name,
  site,
  url: `https://example.com/${encodeURIComponent(name)}`,
  start_time: new Date(Date.now() + startOffsetMs).toISOString(),
  duration,
});

const runningContest = () => contest('Codeforces Round 999', 'codeforces', -30 * 60 * 1000);
const soonContest = () => contest('AtCoder Beginner Contest 999', 'atcoder', 60 * 60 * 1000);
const farContest = () => contest('CodeChef Starters 999', 'codechef', 5 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // A running contest keeps the component on its default tab/window, so the
  // auto-tab logic does not switch the time window mid-test.
  api.get.mockImplementation(async () => baseResponse({ running: [runningContest()] }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ContestTracker', () => {
  it('fetches contests once on mount', async () => {
    render(<ContestTracker />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    // Give a wrongly-scheduled duplicate fetch time to fire.
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('fetches the newly selected window instead of serving a cache entry from another window', async () => {
    api.get.mockImplementation(async (url) => {
      if (url.includes('days=1')) {
        return baseResponse({ upcoming: [soonContest()] });
      }
      return baseResponse({ upcoming: [farContest()] });
    });

    render(<ContestTracker />);

    // The 30-day response has no running contests, so the component switches
    // to the upcoming 24h window. That window must be fetched; serving the
    // 30-day cache entry would show a stale (and here: empty) 24h view.
    expect(await screen.findByText('AtCoder Beginner Contest 999')).toBeTruthy();
    const urls = api.get.mock.calls.map(([url]) => url);
    expect(urls.some((url) => url.includes('days=30'))).toBe(true);
    expect(urls.some((url) => url.includes('days=1'))).toBe(true);
    expect(screen.queryByText('CodeChef Starters 999')).toBeNull();
  });

  it('scopes the localStorage cache to the selected window', async () => {
    render(<ContestTracker />);
    await waitFor(() => expect(localStorage.getItem('contest_tracker_cache:30:7')).toBeTruthy());
  });

  it('runs a single 1s countdown ticker', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    render(<ContestTracker />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    const tickers = setIntervalSpy.mock.calls.filter(([, delay]) => delay === 1000);
    expect(tickers).toHaveLength(1);
    setIntervalSpy.mockRestore();
  });

  it('marks finished ICPC events as Completed instead of a stuck 0s countdown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    api.get.mockImplementation(async () => baseResponse({ running: [runningContest()] }));

    render(<ContestTracker />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'ICPC' }));

    expect(await screen.findAllByText('Completed')).toHaveLength(2);
    expect(screen.queryByText('Starts In')).toBeNull();
  });
});
