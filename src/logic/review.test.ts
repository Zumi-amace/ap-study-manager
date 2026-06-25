import { describe, expect, it } from 'vitest';
import { accuracyRateToQuality, calculateReview } from './review';

describe('accuracyRateToQuality', () => {
  it('正答率の境界をqualityへ変換する', () => {
    expect(accuracyRateToQuality(90)).toBe(5);
    expect(accuracyRateToQuality(80)).toBe(4);
    expect(accuracyRateToQuality(70)).toBe(3);
    expect(accuracyRateToQuality(69.9)).toBe(2);
    expect(accuracyRateToQuality(39)).toBe(0);
  });
});

describe('calculateReview', () => {
  it('成功回数に応じて1日、3日、係数倍へ伸ばす', () => {
    const first = calculateReview({
      repetition: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      accuracyRate: 90,
      reviewedAt: '2026-06-25'
    });
    expect(first.intervalDays).toBe(1);
    expect(first.repetition).toBe(1);
    expect(first.nextReviewDate).toBe('2026-06-26');

    const second = calculateReview({
      repetition: 1,
      intervalDays: first.intervalDays,
      easeFactor: first.easeFactor,
      accuracyRate: 80,
      reviewedAt: '2026-06-26'
    });
    expect(second.intervalDays).toBe(3);
    expect(second.repetition).toBe(2);
  });

  it('不合格時は1日へ戻し、ease factorは1.3未満にならない', () => {
    const result = calculateReview({
      repetition: 4,
      intervalDays: 20,
      easeFactor: 1.3,
      accuracyRate: 0,
      reviewedAt: '2026-06-25'
    });
    expect(result.repetition).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(1.3);
  });
});
