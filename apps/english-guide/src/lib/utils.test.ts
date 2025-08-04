import { describe, it, expect } from 'vitest';
import { generateId, formatDuration, calculateMasteryLevel } from './utils';

describe('utils', () => {
  describe('generateId', () => {
    it('should generate a unique string', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
    });
  });

  describe('calculateMasteryLevel', () => {
    it('should calculate mastery level correctly', () => {
      expect(calculateMasteryLevel(0, 0)).toBe(0);
      expect(calculateMasteryLevel(5, 10)).toBe(50);
      expect(calculateMasteryLevel(10, 10)).toBe(100);
    });
  });
});