import { addDays, toLocalDateString } from './date';

export function accuracyRateToQuality(accuracyRate: number): number {
  if (accuracyRate >= 90) return 5;
  if (accuracyRate >= 80) return 4;
  if (accuracyRate >= 70) return 3;
  if (accuracyRate >= 60) return 2;
  if (accuracyRate >= 40) return 1;
  return 0;
}

export interface ReviewCalculationInput {
  repetition: number;
  intervalDays: number;
  easeFactor: number;
  accuracyRate: number;
  reviewedAt?: string;
}

export interface ReviewCalculationResult {
  repetition: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string;
}

export function calculateReview(input: ReviewCalculationInput): ReviewCalculationResult {
  const quality = accuracyRateToQuality(input.accuracyRate);
  let repetition = input.repetition;
  let intervalDays = input.intervalDays;
  let easeFactor = input.easeFactor;

  // 簡略SM-2として、成功時の間隔伸長とEF更新を採用する。
  // 失敗時は反復回数と間隔だけをリセットし、苦手分野のEFが下がり続けるのを防ぐ。
  if (quality >= 3) {
    intervalDays =
      repetition === 0 ? 1 : repetition === 1 ? 3 : Math.round(intervalDays * input.easeFactor);
    repetition += 1;
    easeFactor = Math.max(
      1.3,
      input.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  } else {
    repetition = 0;
    intervalDays = 1;
  }

  const reviewedAt = input.reviewedAt ?? toLocalDateString();

  return {
    repetition,
    intervalDays,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate: addDays(reviewedAt, intervalDays)
  };
}
