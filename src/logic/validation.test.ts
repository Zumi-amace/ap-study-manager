import { describe, expect, it } from 'vitest';
import { validateStudyLog } from './validation';

describe('validateStudyLog', () => {
  it('正解数が問題数を超える入力を拒否する', () => {
    const errors = validateStudyLog({
      studied_at: '2026-06-25',
      study_time_min: 20,
      total_questions: 10,
      correct_count: 11,
      tag_ids: [1]
    });
    expect(errors).toContain('正解数は問題数以下にしてください。');
  });

  it('正常な入力を受け入れる', () => {
    const errors = validateStudyLog({
      studied_at: '2026-06-25',
      study_time_min: 20,
      total_questions: 10,
      correct_count: 8,
      tag_ids: [1, 2]
    });
    expect(errors).toEqual([]);
  });
});
