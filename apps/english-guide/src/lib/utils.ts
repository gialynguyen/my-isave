import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function calculateNextReviewDate(masteryLevel: number, lastReviewed: Date): Date {
  const baseInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const multiplier = Math.max(1, masteryLevel / 20); // Increase interval based on mastery
  const nextReview = new Date(lastReviewed.getTime() + (baseInterval * multiplier));
  return nextReview;
}

export function calculateMasteryLevel(correctAttempts: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  const accuracy = correctAttempts / totalAttempts;
  return Math.min(100, Math.floor(accuracy * 100));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}