import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
import { algorithmService } from '../../services/algorithmService';
import useVisualizationStore from '../state';

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

/**
 * Wave-2 algorithms, exercised through the real page rather than the engine:
 * registry wiring, the play-through path for the array/tree/graph branches,
 * and the content-only placeholder for Hash Table.
 */
describe('AlgorithmDetailV2 — new algorithms through the page', () => {
  beforeEach(() => {
    useVisualizationStore.setState({
      steps: [], currentStep: -1, status: 'idle', speed: 1,
      stats: { comparisons: 0, swaps: 0, accesses: 0 }, metadata: null,
    });
  });

  const typeOf = (name) => {
    if (name.startsWith('BST')) return 'Tree';
    if (name === 'Bellman-Ford') return 'Graph';
    if (name === 'Hash Table') return 'Hashing';
    return 'Sorting';
  };

  const serve = (name) => {
    algorithmService.getById.mockResolvedValue({
      id: 29,
      name,
      description: `${name} — description served by the mocked API.`,
      explanation: '<p>Safe text</p>',
      code: '',
      difficulty: 'easy',
      complexity: 'O(n)',
      type_name: typeOf(name),
    });
  };

  const renderPage = () => render(
    <MemoryRouter initialEntries={['/algorithms/29']}>
      <Routes>
        <Route path="/algorithms/:id" element={<AlgorithmDetailV2 />} />
      </Routes>
    </MemoryRouter>
  );

  const waitLoaded = () => waitFor(() => {
    expect(screen.queryByText('Loading algorithm...')).toBeNull();
  });

  it.each(['Counting Sort', 'Shell Sort', 'BST Search', 'BST In-Order Traversal', 'Bellman-Ford'])(
    '%s: the Visualize tab offers playback controls, not the coming-soon placeholder',
    async (name) => {
      serve(name);
      renderPage();
      await waitLoaded();

      // The learning panels resolve through the content map for this name.
      expect(screen.getByText(`When to Use: ${name}`)).toBeTruthy();

      fireEvent.click(screen.getByText('Visualize'));
      expect(await screen.findByLabelText('Visualization playback controls')).toBeTruthy();
      expect(screen.getByText('Input Settings')).toBeTruthy();
      expect(screen.queryByText('Visualization coming soon')).toBeNull();
    }
  );

  it.each(['Counting Sort', 'BST In-Order Traversal', 'Bellman-Ford'])(
    '%s: pressing Play runs the real generator and loads steps into the store',
    async (name) => {
      serve(name);
      renderPage();
      await waitLoaded();

      // The DB description is served verbatim on the page.
      expect(
        screen.getAllByText(`${name} — description served by the mocked API.`).length
      ).toBeGreaterThan(0);

      fireEvent.click(screen.getByText('Visualize'));
      fireEvent.click(await screen.findByLabelText('Play visualization'));

      await waitFor(() => {
        expect(useVisualizationStore.getState().steps.length).toBeGreaterThan(0);
      });
      const { metadata } = useVisualizationStore.getState();
      expect(metadata?.name).toBeTruthy();
      expect(metadata?.timeComplexity).toBeTruthy();

      // Stop the timeline so it cannot tick after the assertions.
      fireEvent.click(screen.getByLabelText('Reset visualization'));
    }
  );

  it('Hash Table: shows the honest placeholder instead of a dead Play button', async () => {
    serve('Hash Table');
    renderPage();
    await waitLoaded();

    // Its content panels still resolve — the entry is not silently missing.
    expect(screen.getByText('When to Use: Hash Table')).toBeTruthy();

    fireEvent.click(screen.getByText('Visualize'));
    expect(screen.getByText('Visualization coming soon')).toBeTruthy();
    expect(screen.queryByText('Input Settings')).toBeNull();
    expect(screen.queryByLabelText('Visualization playback controls')).toBeNull();
    expect(screen.queryByLabelText('Play visualization')).toBeNull();
  });
});
