import { describe, it, expect } from 'vitest';
import { bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, heapSort } from '../algorithms/sorting';

describe('Sorting Algorithms', () => {
  const testArray = [64, 34, 25, 12, 22, 11, 90];
  const sortedArray = [11, 12, 22, 25, 34, 64, 90];

  const algorithms = [
    { name: 'Bubble Sort', fn: bubbleSort },
    { name: 'Selection Sort', fn: selectionSort },
    { name: 'Insertion Sort', fn: insertionSort },
    { name: 'Merge Sort', fn: mergeSort },
    { name: 'Quick Sort', fn: quickSort },
    { name: 'Heap Sort', fn: heapSort },
  ];

  algorithms.forEach(({ name, fn }) => {
    describe(name, () => {
      it('should return steps array', () => {
        const result = fn(testArray);
        expect(result.steps).toBeDefined();
        expect(Array.isArray(result.steps)).toBe(true);
        expect(result.steps.length).toBeGreaterThan(0);
      });

      it('should return metadata', () => {
        const result = fn(testArray);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.name).toBeDefined();
        expect(result.metadata.timeComplexity).toBeDefined();
        expect(result.metadata.spaceComplexity).toBeDefined();
      });

      it('should have steps with required fields', () => {
        const result = fn(testArray);
        result.steps.forEach(step => {
          expect(step.type).toBeDefined();
          expect(step.timestamp).toBeDefined();
          expect(step.timestamp).toBeGreaterThanOrEqual(0);
          expect(step.timestamp).toBeLessThanOrEqual(1);
        });
      });

      it('should produce sorted result', () => {
        const result = fn(testArray);
        // Simulate the sorting to verify correctness
        const arr = [...testArray];
        result.steps.forEach(step => {
          if (step.type === 'swap' && step.indices && step.values) {
            step.indices.forEach((idx, j) => {
              if (step.values[j] !== undefined) arr[idx] = step.values[j];
            });
          }
          if (step.type === 'set' && step.indices && step.values) {
            step.indices.forEach((idx, j) => {
              if (step.values[j] !== undefined) arr[idx] = step.values[j];
            });
          }
        });
        // After all steps, array should be sorted
        const sorted = [...arr].sort((a, b) => a - b);
        expect(arr).toEqual(sorted);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle single element array', () => {
      const result = mergeSort([5]);
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const result = mergeSort([]);
      expect(result.steps).toBeDefined();
    });

    it('should handle already sorted array', () => {
      const result = bubbleSort([1, 2, 3, 4, 5]);
      expect(result.steps).toBeDefined();
    });

    it('should handle reverse sorted array', () => {
      const result = bubbleSort([5, 4, 3, 2, 1]);
      expect(result.steps).toBeDefined();
    });
  });
});
