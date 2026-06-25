import { describe, expect, it } from 'vitest';
import { isHistoricalReview, uniqueTagIds } from './studyLog';

describe('uniqueTagIds', () => {
  it('同じtag_idを順序を保ったまま1件へ正規化する', () => {
    expect(uniqueTagIds([1, 1, 2, 1, 3, 2])).toEqual([1, 2, 3]);
  });

  it('重複がない入力はそのまま扱える', () => {
    expect(uniqueTagIds([3, 2, 1])).toEqual([3, 2, 1]);
  });
});

describe('isHistoricalReview', () => {
  it('既存の最終学習日より古い入力だけを履歴入力と判定する', () => {
    expect(isHistoricalReview('2026-06-10', '2026-06-25')).toBe(true);
    expect(isHistoricalReview('2026-06-25', '2026-06-25')).toBe(false);
    expect(isHistoricalReview('2026-06-26', '2026-06-25')).toBe(false);
  });

  it('初回学習は履歴入力と判定しない', () => {
    expect(isHistoricalReview('2026-06-10')).toBe(false);
  });
});
