import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CodeforcesAnalyzer from '../CodeforcesAnalyzer';

let mockUser;
const mockUpdateUser = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }),
}));

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const cfProfile = {
  handle: 'tourist',
  rank: 'expert',
  rating: 1600,
  maxRating: 1800,
};

const stubCodeforcesFetch = ({ userInfoStatus = 'OK', submissionsStatus = 'OK' } = {}) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (url.includes('user.info')) {
        return {
          json: async () =>
            userInfoStatus === 'OK'
              ? { status: 'OK', result: [cfProfile] }
              : { status: 'FAILED', comment: 'handles: User with handle tourist not found' },
        };
      }
      if (url.includes('user.status')) {
        return { json: async () => ({ status: submissionsStatus, result: [] }) };
      }
      if (url.includes('user.rating')) {
        return { json: async () => ({ status: 'OK', result: [] }) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: 1, name: 'Test User', codeforces_handle: 'tourist' };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CodeforcesAnalyzer failure states', () => {
  it('shows a statistics-unavailable card instead of blank/broken cards when user.status fails', async () => {
    stubCodeforcesFetch({ submissionsStatus: 'FAILED' });
    const { container } = render(<CodeforcesAnalyzer />);

    await waitFor(() => expect(container.querySelector('.cf-stats-unavailable')).toBeTruthy());
    expect(container.querySelector('.cf-stats-grid')).toBeNull();
    expect(container.querySelector('.cf-stat-card')).toBeNull();
  });

  it('shows a friendly not-found error and clears any stale profile', async () => {
    stubCodeforcesFetch({ userInfoStatus: 'FAILED' });
    const { container } = render(<CodeforcesAnalyzer />);

    await waitFor(() => expect(container.querySelector('.cf-error')).toBeTruthy());
    expect(screen.getByText('Codeforces user "tourist" was not found.')).toBeTruthy();
    expect(container.querySelector('.cf-profile-header')).toBeNull();
  });
});
