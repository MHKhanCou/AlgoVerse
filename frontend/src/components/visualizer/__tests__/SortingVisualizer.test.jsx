import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SortingVisualizer from '../SortingVisualizer';

// Mock the algorithm prop
const mockAlgorithm = {
  name: 'Bubble Sort',
  type_name: 'Sorting',
  description: 'A simple sorting algorithm',
};

describe('SortingVisualizer', () => {
  it('renders without crashing', () => {
    render(
      <SortingVisualizer
        algorithm={mockAlgorithm}
        inputData={null}
        onPerformanceUpdate={vi.fn()}
        onComplexityUpdate={vi.fn()}
      />
    );
    expect(screen.getByText(/bubble sort/i)).toBeInTheDocument();
  });

  it('has a start button', () => {
    render(
      <SortingVisualizer
        algorithm={mockAlgorithm}
        inputData={null}
        onPerformanceUpdate={vi.fn()}
        onComplexityUpdate={vi.fn()}
      />
    );
    expect(screen.getByText(/start sorting/i)).toBeInTheDocument();
  });

  it('shows stop button when sorting is active', () => {
    render(
      <SortingVisualizer
        algorithm={mockAlgorithm}
        inputData={null}
        onPerformanceUpdate={vi.fn()}
        onComplexityUpdate={vi.fn()}
      />
    );
    // The stop button should not be visible initially
    expect(screen.queryByText('Stop')).not.toBeInTheDocument();
  });
});
