import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserPublicPage from '../../pages/UserPublicPage';
import { userService } from '../../services/userService';
import api from '../../services/api';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'u1' }),
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));

vi.mock('../../services/userService', () => ({
  userService: { getPublicProfile: vi.fn() },
}));

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));

const blog = (i) => ({ id: i, title: `Post ${i}`, created_at: '2024-01-01T00:00:00Z' });

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom has no IntersectionObserver; the modal effect needs a stub.
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UserPublicPage CF and blog list states', () => {
  it('shows a rating loading state instead of the not-available fallback', async () => {
    userService.getPublicProfile.mockResolvedValue({ name: 'Alice', codeforces_handle: 'tourist' });
    api.get.mockResolvedValue({ data: [] });
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    render(<UserPublicPage />);

    expect(await screen.findByText(/Loading rating/i)).toBeTruthy();
    expect(screen.queryByText(/Rating info not available/i)).toBeNull();
  });

  it('shows the rating fallback only when the request fails', async () => {
    userService.getPublicProfile.mockResolvedValue({ name: 'Alice', codeforces_handle: 'tourist' });
    api.get.mockResolvedValue({ data: [] });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ status: 'FAILED', comment: 'Call limit exceeded' }),
      })),
    );

    render(<UserPublicPage />);

    expect(await screen.findByText(/Rating info not available/i)).toBeTruthy();
  });

  it('offers View all when the first blogs page is full and the modal is reachable', async () => {
    userService.getPublicProfile.mockResolvedValue({ name: 'Alice' });
    api.get.mockResolvedValue({ data: [blog(1), blog(2), blog(3), blog(4), blog(5)] });

    render(<UserPublicPage />);

    const viewAll = await screen.findByRole('button', { name: 'View all' });
    fireEvent.click(viewAll);

    expect(await screen.findByText(/All Blogs by Alice/)).toBeTruthy();
  });

  it('hides View all when every blog fits on the first page', async () => {
    userService.getPublicProfile.mockResolvedValue({ name: 'Alice' });
    api.get.mockResolvedValue({ data: [blog(1), blog(2), blog(3)] });

    render(<UserPublicPage />);

    expect(await screen.findByText('Post 1')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /View all/ })).toBeNull();
  });
});
