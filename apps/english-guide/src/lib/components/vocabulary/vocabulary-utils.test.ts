import { describe, it, expect } from 'vitest';
import type { DifficultyLevel } from '$lib/types';

// Test utility functions that would be used in components
describe('Vocabulary Component Utilities', () => {
  describe('getDifficultyColor', () => {
    function getDifficultyColor(difficulty: DifficultyLevel): string {
      switch (difficulty) {
        case 'beginner':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'intermediate':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'advanced':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }

    it('should return green colors for beginner difficulty', () => {
      const result = getDifficultyColor('beginner');
      expect(result).toBe('bg-green-100 text-green-800 border-green-200');
    });

    it('should return yellow colors for intermediate difficulty', () => {
      const result = getDifficultyColor('intermediate');
      expect(result).toBe('bg-yellow-100 text-yellow-800 border-yellow-200');
    });

    it('should return red colors for advanced difficulty', () => {
      const result = getDifficultyColor('advanced');
      expect(result).toBe('bg-red-100 text-red-800 border-red-200');
    });
  });

  describe('getMasteryColor', () => {
    function getMasteryColor(level: number): string {
      if (level >= 80) return 'bg-green-500';
      if (level >= 60) return 'bg-yellow-500';
      if (level >= 40) return 'bg-orange-500';
      return 'bg-red-500';
    }

    it('should return green for high mastery (80+)', () => {
      expect(getMasteryColor(85)).toBe('bg-green-500');
      expect(getMasteryColor(80)).toBe('bg-green-500');
    });

    it('should return yellow for good mastery (60-79)', () => {
      expect(getMasteryColor(75)).toBe('bg-yellow-500');
      expect(getMasteryColor(60)).toBe('bg-yellow-500');
    });

    it('should return orange for fair mastery (40-59)', () => {
      expect(getMasteryColor(55)).toBe('bg-orange-500');
      expect(getMasteryColor(40)).toBe('bg-orange-500');
    });

    it('should return red for low mastery (<40)', () => {
      expect(getMasteryColor(35)).toBe('bg-red-500');
      expect(getMasteryColor(0)).toBe('bg-red-500');
    });
  });

  describe('formatTime', () => {
    function formatTime(seconds: number): string {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    it('should format seconds correctly', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
    });
  });

  describe('calculateAccuracy', () => {
    function calculateAccuracy(correct: number, incorrect: number): number {
      const total = correct + incorrect;
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    it('should calculate accuracy correctly', () => {
      expect(calculateAccuracy(8, 2)).toBe(80);
      expect(calculateAccuracy(10, 0)).toBe(100);
      expect(calculateAccuracy(0, 10)).toBe(0);
      expect(calculateAccuracy(0, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateAccuracy(1, 2)).toBe(33); // 33.33... rounded to 33
      expect(calculateAccuracy(2, 1)).toBe(67); // 66.66... rounded to 67
    });
  });

  describe('shuffleArray', () => {
    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    it('should return array with same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled).toHaveLength(original.length);
    });

    it('should contain all original elements', () => {
      const original = ['a', 'b', 'c', 'd'];
      const shuffled = shuffleArray(original);
      
      for (const item of original) {
        expect(shuffled).toContain(item);
      }
    });

    it('should return a new array', () => {
      const original = [1, 2, 3];
      const shuffled = shuffleArray(original);
      expect(shuffled).not.toBe(original);
    });

    it('should handle empty array', () => {
      const shuffled = shuffleArray([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const shuffled = shuffleArray(['single']);
      expect(shuffled).toEqual(['single']);
    });
  });
});