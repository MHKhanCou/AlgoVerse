import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import PublicCodeforcesAnalyzer from '../PublicCodeforcesAnalyzer';

const cfProfile = {
  handle: 'tourist',
  avatar: 'https://example.com/avatar.png',
  rank: 'legendary grandmaster',
  rating: 3800,
  maxRating: 3900,
};

const submission = (contestId, index, { tags = [], rating = null, verdict = 'OK' } = {}) => ({
  verdict,
  programmingLanguage: 'GNU G++20',
  problem: { contestId, index, name: `Problem ${contestId}${index}`, tags, rating },
  creationTimeSeconds: 1700000000,
});

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

const renderAnalyzer = () =>
  render(<PublicCodeforcesAnalyzer initialHandles={['tourist']} />);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PublicCodeforcesAnalyzer', () => {
  it('clamps rating progress bars to the visible range', async () => {
    stubCodeforcesFetch({
      ratings: [
        { contestId: 1, contestName: 'Round 1', oldRating: 800, newRating: 500 },
        { contestId: 2, contestName: 'Round 2', oldRating: 3500, newRating: 4000 },
      ],
    });
    const { container } = renderAnalyzer();

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

  it('counts tag and rating charts per problem, not per submission', async () => {
    stubCodeforcesFetch({
      submissions: [
        submission(100, 'A', { tags: ['math'], rating: 1500 }),
        submission(100, 'A', { tags: ['math'], rating: 1500 }), // a retry of the same problem
        submission(101, 'B', { tags: ['math'], rating: 1500 }),
      ],
    });
    const { container } = renderAnalyzer();

    await waitFor(() => expect(container.querySelectorAll('.cf-tag-item').length).toBeGreaterThan(0));

    const tagItem = [...container.querySelectorAll('.cf-tag-item')].find(
      (el) => el.querySelector('.cf-tag-name').textContent === 'math',
    );
    expect(tagItem.querySelector('.cf-tag-count').textContent).toBe('2');

    const ratingItem = [...container.querySelectorAll('.cf-rating-item')].find(
      (el) => el.querySelector('.cf-rating-value').textContent === '1500',
    );
    expect(ratingItem.querySelector('.cf-rating-count').textContent).toBe('2');
  });
});
