import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommonMistakes from '../CommonMistakes';
import WhenToUse from '../WhenToUse';
import { allAlgorithmContent } from '../../../content/algorithms';

const renderPanel = (Component, algorithmName) =>
  render(
    <MemoryRouter>
      <Component algorithmName={algorithmName} />
    </MemoryRouter>,
  );

describe('learning panels', () => {
  it('shows KMP content for KMP, not Bubble Sort fallback content', () => {
    const { container } = renderPanel(CommonMistakes, 'KMP String Matching');
    expect(container.textContent).toContain('LPS');
    expect(container.textContent).not.toContain('swapped flag');
  });

  it('shows knapsack content for 0/1 Knapsack, not Bubble Sort fallback content', () => {
    const { container } = renderPanel(WhenToUse, '0/1 Knapsack');
    expect(container.textContent).toContain('Capacity');
    expect(container.textContent).not.toContain('Nearly sorted data');
  });

  it('resolves names that drifted between the database and the old panels', () => {
    // 'Knapsack Problem' is the name the old panel maps used; the database
    // stores '0/1 Knapsack'. Both must resolve to the knapsack entry.
    const { container } = renderPanel(CommonMistakes, 'Knapsack Problem');
    expect(container.textContent).toContain('unbounded');
    expect(container.textContent).not.toContain('swapped flag');
  });

  it('resolves BFS aliases to breadth-first content', () => {
    const { container } = renderPanel(WhenToUse, 'BFS');
    expect(container.textContent).toContain('unweighted');
    expect(container.textContent).not.toContain('Nearly sorted data');
  });

  it('renders nothing for an unknown algorithm instead of guessing', () => {
    const mistakes = renderPanel(CommonMistakes, 'Bubble Sword');
    expect(mistakes.container.textContent).toBe('');
    const whenToUse = renderPanel(WhenToUse, 'Bubble Sword');
    expect(whenToUse.container.textContent).toBe('');
  });

  it.each(allAlgorithmContent.map((entry) => [entry.name]))(
    '%s renders both panels with real content',
    (name) => {
      const mistakes = renderPanel(CommonMistakes, name);
      expect(mistakes.container.textContent, `mistakes for ${name}`).not.toBe('');
      const whenToUse = renderPanel(WhenToUse, name);
      expect(whenToUse.container.textContent, `when-to-use for ${name}`).not.toBe('');
    },
  );
});
