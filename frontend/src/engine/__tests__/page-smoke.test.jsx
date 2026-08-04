import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/**
 * Smoke test for the real AlgorithmDetailV2 page: mounts it with a mocked API
 * and asserts it renders without crashing and shows the algorithm content.
 * This is the closest thing to "load the page" available without a browser.
 */

vi.mock('../../services/algorithmService', () => ({
  algorithmService: {
    getById: vi.fn(async () => ({
      id: 1,
      name: 'Bubble Sort',
      description: 'A simple comparison sort.',
      // Deliberately hostile HTML: must be sanitized, not executed.
      explanation: '<p>Safe text</p><img src=x onerror="window.__XSS__=1">',
      code: 'def bubble_sort(a):\n    pass',
      difficulty: 'easy',
      complexity: 'O(n^2)',
      type_name: 'Sorting',
    })),
  },
}));

vi.mock('../../services/userProgressService', () => ({
  userProgressService: {
    getEntry: vi.fn(async () => null),
    createProgress: vi.fn(async () => ({ id: 1, status: 'enrolled' })),
    updateProgress: vi.fn(async () => ({})),
    updateLastAccessed: vi.fn(async () => ({})),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

// Heavy leaf components that need real DOM/network; not under test here.
vi.mock('../../components/RelatedProblems', () => ({ default: () => null }));
vi.mock('../../components/AlgorithmDiscussionBoard', () => ({ default: () => null }));
vi.mock('../../components/editors/CodeEditor', () => ({
  default: ({ code }) => <pre data-testid="code">{code}</pre>,
}));

import AlgorithmDetailV2 from '../../pages/AlgorithmDetailV2';

describe('AlgorithmDetailV2 page smoke test', () => {
  beforeEach(() => {
    delete window.__XSS__;
  });

  it('mounts, fetches, and renders the algorithm without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/algorithms/1']}>
        <Routes>
          <Route path="/algorithms/:id" element={<AlgorithmDetailV2 />} />
        </Routes>
      </MemoryRouter>
    );

    // Loading state resolves into real content: the page renders its tab
    // shell and the algorithm name rather than staying on the spinner or
    // the "not found" branch.
    await waitFor(() => {
      expect(screen.queryByText('Loading algorithm...')).toBeNull();
    });
    expect(screen.queryByText('Algorithm not found')).toBeNull();
    expect(screen.getAllByText(/Bubble Sort/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Visualize')).toBeTruthy();
  });

  it('sanitizes hostile explanation HTML (no inline handlers survive)', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/algorithms/1']}>
        <Routes>
          <Route path="/algorithms/:id" element={<AlgorithmDetailV2 />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Safe text')).toBeTruthy();
    });

    // The benign markup survives; the attack vector does not.
    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('onerror')).toBeNull();
    }
    expect(container.innerHTML).not.toContain('onerror');
    expect(window.__XSS__).toBeUndefined();
  });
});
