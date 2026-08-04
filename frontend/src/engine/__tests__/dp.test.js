import { describe, it, expect } from 'vitest';
import { fibonacciDP, knapsack, lcs, coinChange } from '../algorithms/dp';

describe('Dynamic Programming Algorithms', () => {
  describe('Fibonacci DP', () => {
    it('should compute fibonacci numbers', () => {
      const result = fibonacciDP(10);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Fibonacci (DP)');
    });

    it('should handle n=0', () => {
      const result = fibonacciDP(0);
      expect(result.steps).toBeDefined();
    });

    it('should handle n=1', () => {
      const result = fibonacciDP(1);
      expect(result.steps).toBeDefined();
    });
  });

  describe('Knapsack', () => {
    it('should solve knapsack problem', () => {
      const weights = [2, 3, 4, 5];
      const values = [6, 10, 12, 15];
      const result = knapsack(weights, values, 10);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('0/1 Knapsack');
    });
  });

  describe('LCS', () => {
    it('should find longest common subsequence', () => {
      const result = lcs('ABCBDAB', 'BDCABA');
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Longest Common Subsequence');
    });

    it('should handle empty strings', () => {
      const result = lcs('', '');
      expect(result.steps).toBeDefined();
    });
  });

  describe('Coin Change', () => {
    it('should find minimum coins', () => {
      const result = coinChange([1, 5, 10, 25], 30);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Coin Change');
    });

    it('should handle impossible amount', () => {
      const result = coinChange([5], 3);
      expect(result.steps).toBeDefined();
    });
  });
});
