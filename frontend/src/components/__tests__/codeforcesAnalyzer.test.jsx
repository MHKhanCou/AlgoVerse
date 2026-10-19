import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CodeforcesAnalyzer from '../CodeforcesAnalyzer';
import api from '../../services/api';

const mockUpdateUser = vi.fn();
let mockUser;

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }),
}));

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

vi.mock('../../services/userService', () => ({
  userService: {},
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const cfProfile = {
  handle: 'tourist',
  avatar: 'https://example.com/avatar.png',
  rank: 'legendary grandmaster',
  rating: 3800,
  maxRating: 3900,
};

const stubCodeforcesFetch = ({ submissions = [], ratings = [] } = {}) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (url.includes('user.info')) {
        return { json: async () => ({ status: 'OK', result: [cfProfile] }) };
      }
      if (url.includes('user.status')) {
        return { json: async () => ({ status: 'OK', result: submissions }) };
      }
      if (url.includes('user.rating')) {
        return { json: async () => ({ status: 'OK', result: ratings }) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: 1, name: 'Test User', codeforces_handle: '' };
  api.put.mockResolvedValue({ data: { status: 'success' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CodeforcesAnalyzer', () => {
  it('keeps the fetched Codeforces profile after saving a handle', async () => {
    stubCodeforcesFetch();
    const { container } = render(<CodeforcesAnalyzer />);

    fireEvent.change(screen.getByPlaceholderText(/enter your codeforces handle/i), {
      target: { value: 'tourist' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    // The profile header must show the CF API data, not the auth user object.
    await waitFor(() =>
      expect(container.querySelector('.cf-profile-name')?.textContent).toBe('tourist'),
    );

    // The saved handle must reach the app-wide auth context.
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalled());
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ codeforces_handle: 'tourist' }),
    );
  });

  it('clamps rating progress bars to the visible range', async () => {
    mockUser = { id: 1, name: 'Test User', codeforces_handle: 'tourist' };
    stubCodeforcesFetch({
      ratings: [
        { contestId: 1, contestName: 'Round 1', oldRating: 800, newRating: 500 },
        { contestId: 2, contestName: 'Round 2', oldRating: 3500, newRating: 4000 },
      ],
    });
    const { container } = render(<CodeforcesAnalyzer />);

    await waitFor(() =>
      expect(container.querySelectorAll('.cf-rating-bars .cf-rating-bar').length).toBe(2),
    );
    const heights = [...container.querySelectorAll('.cf-rating-bars .cf-rating-bar')].map((el) =>
      parseFloat(el.style.height),
    );
    for (const height of heights) {
      expect(height).toBeGreaterThanOrEqual(0);
      expect(height).toBeLessThanOrEqual(100);
    }
  });
});
