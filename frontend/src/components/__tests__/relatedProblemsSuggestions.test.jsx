import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RelatedProblems from '../RelatedProblems';

const { mockGetRelatedProblems, mockSuggestProblems } = vi.hoisted(() => ({
  mockGetRelatedProblems: vi.fn(),
  mockSuggestProblems: vi.fn(),
}));

vi.mock('../../services/algorithmService', () => ({
  algorithmService: {
    getRelatedProblems: (...args) => mockGetRelatedProblems(...args),
    suggestProblems: (...args) => mockSuggestProblems(...args),
  },
}));

vi.mock('../../services/userProgressService', () => ({
  userProgressService: {
    getBatchProgress: vi.fn(async () => ({})),
    createProgress: vi.fn(),
    updateProgress: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const aiSuggestions = {
  ai: true,
  level: 1240,
  level_source: 'codeforces',
  summary: 'A gentle ramp from warm-up to stretch.',
  problems: [
    {
      id: 'cf-101A',
      title: 'Sort Them All',
      name: 'Sort Them All',
      platform: 'Codeforces',
      difficulty: 'easy',
      url: 'https://codeforces.com/problemset/problem/101/A',
      problem_url: 'https://codeforces.com/problemset/problem/101/A',
      problem_id: '101A',
      description: 'Warm-up on sorting basics.',
      tags: 'sortings, implementation',
      rating: 900,
    },
    {
      id: 'cses-1621',
      title: 'Distinct Numbers',
      name: 'Distinct Numbers',
      platform: 'CSES',
      difficulty: 'beginner',
      url: 'https://cses.fi/problemset/task/1621',
      problem_url: 'https://cses.fi/problemset/task/1621',
      problem_id: '1621',
      description: 'A classic CSES problem that trains this topic.',
      tags: '',
      rating: null,
    },
  ],
};

const renderPanel = () =>
  render(<RelatedProblems algorithm={{ id: 3, name: 'Quick Sort' }} user={{ id: 1, name: 'Test User' }} />);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRelatedProblems.mockResolvedValue([]);
  mockSuggestProblems.mockResolvedValue(aiSuggestions);
});

describe('RelatedProblems suggestions', () => {
  it('renders AI-picked suggestions with real links when there are no curated problems', async () => {
    const { container } = renderPanel();

    await waitFor(() =>
      expect(screen.getByText('Suggested practice problems')).toBeTruthy()
    );

    expect(screen.getByText('AI-picked')).toBeTruthy();
    expect(screen.getByText('A gentle ramp from warm-up to stretch.')).toBeTruthy();
    expect(screen.getByText('Sort Them All')).toBeTruthy();
    expect(screen.getByText('Distinct Numbers')).toBeTruthy();
    expect(
      screen.getByText(/matched to your Codeforces rating \(1240\)/)
    ).toBeTruthy();

    const cards = container.querySelectorAll('.suggested-problem-card');
    expect(cards.length).toBe(2);
    const links = screen.getAllByRole('link', { name: /solve problem/i });
    expect(links[0].getAttribute('href')).toBe(
      'https://codeforces.com/problemset/problem/101/A'
    );
    // CF rating badge is shown for rated problems, hidden for CSES tasks.
    expect(screen.getByText('CF 900')).toBeTruthy();

    // The curated "no related problems" copy must not fight the shown list.
    expect(screen.queryByText(/No related problems found/i)).toBeNull();
  });

  it('requests a fresh set when the refresh button is used', async () => {
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText('Suggested practice problems')).toBeTruthy()
    );

    fireEvent.click(screen.getByRole('button', { name: /new set/i }));

    await waitFor(() =>
      expect(mockSuggestProblems).toHaveBeenLastCalledWith(3, { refresh: true })
    );
  });

  it('shows a friendly fallback when suggestions cannot be loaded', async () => {
    mockSuggestProblems.mockRejectedValue(new Error('Network error'));

    renderPanel();

    await waitFor(() =>
      expect(
        screen.getByText(/Couldn't load suggestions right now/)
      ).toBeTruthy()
    );
  });

  it('labels deterministic suggestions without the AI badge', async () => {
    mockSuggestProblems.mockResolvedValue({
      ...aiSuggestions,
      ai: false,
      summary: '',
      level: null,
      level_source: 'default',
    });

    renderPanel();

    await waitFor(() =>
      expect(screen.getByText('Suggested practice problems')).toBeTruthy()
    );

    expect(screen.queryByText('AI-picked')).toBeNull();
    expect(
      screen.getByText('Real Codeforces and CSES problems that fit this topic')
    ).toBeTruthy();
    expect(screen.getByText('Sort Them All')).toBeTruthy();
  });
});
