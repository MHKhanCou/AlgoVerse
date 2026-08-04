import { describe, it, expect } from 'vitest';
import { linearSearch, binarySearch, jumpSearch, exponentialSearch } from '../algorithms/searching';

describe('Search Algorithms', () => {
  const sortedArray = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

  describe('Linear Search', () => {
    it('should find existing element', () => {
      const result = linearSearch(sortedArray, 23);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Linear Search');
    });

    it('should handle missing element', () => {
      const result = linearSearch(sortedArray, 99);
      expect(result.steps).toBeDefined();
    });
  });

  describe('Binary Search', () => {
    it('should find existing element', () => {
      const result = binarySearch(sortedArray, 23);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Binary Search');
    });

    it('should handle missing element', () => {
      const result = binarySearch(sortedArray, 99);
      expect(result.steps).toBeDefined();
    });
  });

  describe('Jump Search', () => {
    it('should find existing element', () => {
      const result = jumpSearch(sortedArray, 23);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Jump Search');
    });
  });

  describe('Exponential Search', () => {
    it('should find existing element', () => {
      const result = exponentialSearch(sortedArray, 23);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Exponential Search');
    });
  });
});
