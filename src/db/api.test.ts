import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  logs: [] as Array<Record<string, unknown> & { id: number }>,
  mappings: [] as Array<{ study_log_id: number; tag_id: number }>,
  reviews: [] as Array<Record<string, unknown> & { id: number; tag_id: number }>,
  nextLogId: 1,
  nextReviewId: 1
}));

const fakeDb = vi.hoisted(() => ({
  study_logs: {
    add: async (log: Record<string, unknown>) => {
      const id = state.nextLogId++;
      state.logs.push({ ...log, id });
      return id;
    },
    where: () => ({
      equals: () => ({
        toArray: async () => [...state.logs]
      })
    })
  },
  study_log_tags: {
    bulkAdd: async (mappings: Array<{ study_log_id: number; tag_id: number }>) => {
      state.mappings.push(...mappings);
    },
    toArray: async () => [...state.mappings]
  },
  review_schedules: {
    where: () => ({
      equals: (tagId: number) => ({
        first: async () => state.reviews.find((review) => review.tag_id === tagId)
      })
    }),
    add: async (review: Record<string, unknown> & { tag_id: number }) => {
      const id = state.nextReviewId++;
      state.reviews.push({ ...review, id });
      return id;
    },
    put: async (review: Record<string, unknown> & { id?: number; tag_id: number }) => {
      const index = state.reviews.findIndex((current) => current.id === review.id);
      if (index >= 0) state.reviews[index] = review as typeof state.reviews[number];
      return review.id;
    },
    clear: async () => {
      state.reviews.length = 0;
      state.nextReviewId = 1;
    },
    orderBy: () => ({
      toArray: async () => [...state.reviews]
    })
  },
  weak_area_tags: {
    bulkGet: async () => []
  },
  transaction: async (
    _mode: string,
    _tables: unknown[],
    callback: () => Promise<unknown>
  ) => callback()
}));

vi.mock('./database', () => ({ db: fakeDb }));

import { createStudyLog, rebuildReviewSchedules, recalcReview } from './api';

describe('study log API safeguards', () => {
  beforeEach(() => {
    state.logs.length = 0;
    state.mappings.length = 0;
    state.reviews.length = 0;
    state.nextLogId = 1;
    state.nextReviewId = 1;
  });

  it('重複したtag_idでもログ保存に成功し、タグ関連と復習予定を1件だけ作る', async () => {
    const log = await createStudyLog({
      studied_at: '2026-06-25',
      study_time_min: 30,
      total_questions: 10,
      correct_count: 8,
      tag_ids: [1, 1, 1]
    });

    expect(log.id).toBe(1);
    expect(state.logs).toHaveLength(1);
    expect(state.mappings).toEqual([{ study_log_id: 1, tag_id: 1 }]);
    expect(state.reviews).toHaveLength(1);
    expect(state.reviews[0].tag_id).toBe(1);
  });

  it('古い日付の再計算ではnext_review_dateとlast_reviewed_atを巻き戻さない', async () => {
    const latest = await recalcReview(1, 90, '2026-06-25');
    const historical = await recalcReview(1, 20, '2026-06-10');

    expect(historical.next_review_date).toBe(latest.next_review_date);
    expect(historical.last_reviewed_at).toBe('2026-06-25');
    expect(state.reviews).toHaveLength(1);
  });

  it('新しい日付の再計算では復習予定と最終学習日を更新する', async () => {
    const first = await recalcReview(1, 90, '2026-06-20');
    const latest = await recalcReview(1, 90, '2026-06-25');

    expect(latest.last_reviewed_at).toBe('2026-06-25');
    expect(latest.next_review_date).not.toBe(first.next_review_date);
    expect(latest.repetition).toBe(2);
  });

  it('保存済みログを日付順に再処理して壊れた復習予定を再構築する', async () => {
    await createStudyLog({
      studied_at: '2026-06-20',
      study_time_min: 20,
      total_questions: 10,
      correct_count: 9,
      tag_ids: [1]
    });
    await createStudyLog({
      studied_at: '2026-06-25',
      study_time_min: 20,
      total_questions: 10,
      correct_count: 8,
      tag_ids: [1]
    });
    state.reviews[0].next_review_date = '1999-01-01';

    const rebuilt = await rebuildReviewSchedules();

    expect(state.reviews).toHaveLength(1);
    expect(state.reviews[0].last_reviewed_at).toBe('2026-06-25');
    expect(state.reviews[0].next_review_date).toBe('2026-06-28');
    expect(rebuilt).toHaveLength(1);
  });
});
