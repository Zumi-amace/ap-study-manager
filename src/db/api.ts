import { db } from './database';
import { calculateReview } from '../logic/review';
import { toLocalDateString } from '../logic/date';
import { isHistoricalReview, uniqueTagIds } from '../logic/studyLog';
import { validateStudyLog } from '../logic/validation';
import type {
  AppSettings,
  CreateStudyLogInput,
  DailySummary,
  LinkOpenMode,
  ReviewSchedule,
  SavedLink,
  StudyLog,
  StudyLogFilter,
  Tag,
  WeaknessSummary
} from '../types';

// MVPは端末内の単一ユーザー専用。user_idは将来の同期・複数ユーザー化に備えて保持する。
const USER_ID = 1;

async function attachTags(logs: StudyLog[]): Promise<StudyLog[]> {
  const logIds = logs.flatMap((log) => (log.id === undefined ? [] : [log.id]));
  if (logIds.length === 0) return logs.map((log) => ({ ...log, tags: [] }));

  const mappings = await db.study_log_tags.where('study_log_id').anyOf(logIds).toArray();
  const tagIds = [...new Set(mappings.map((mapping) => mapping.tag_id))];
  const tags = (await db.weak_area_tags.bulkGet(tagIds)).filter(
    (tag): tag is Tag => Boolean(tag)
  );
  const tagById = new Map(tags.map((tag) => [tag.id!, tag]));
  const tagIdsByLogId = new Map<number, number[]>();

  for (const mapping of mappings) {
    const current = tagIdsByLogId.get(mapping.study_log_id) ?? [];
    current.push(mapping.tag_id);
    tagIdsByLogId.set(mapping.study_log_id, current);
  }

  return logs.map((log) => ({
    ...log,
    tags: (tagIdsByLogId.get(log.id!) ?? [])
      .map((tagId) => tagById.get(tagId))
      .filter((tag): tag is Tag => Boolean(tag))
  }));
}

export async function createStudyLog(input: CreateStudyLogInput): Promise<StudyLog> {
  const normalizedTagIds = uniqueTagIds(input.tag_ids);
  const normalizedInput = { ...input, tag_ids: normalizedTagIds };
  const errors = validateStudyLog(normalizedInput);
  if (errors.length) throw new Error(errors.join('\n'));

  return db.transaction(
    'rw',
    [db.study_logs, db.study_log_tags, db.review_schedules],
    async () => {
      const accuracyRate = Math.round((input.correct_count / input.total_questions) * 1000) / 10;
      const log: StudyLog = {
        user_id: USER_ID,
        studied_at: input.studied_at,
        study_time_min: input.study_time_min,
        total_questions: input.total_questions,
        correct_count: input.correct_count,
        accuracy_rate: accuracyRate,
        wrong_reason_note: input.wrong_reason_note?.trim() || undefined,
        created_at: new Date().toISOString()
      };
      const id = (await db.study_logs.add(log)) as number;

      await db.study_log_tags.bulkAdd(
        normalizedTagIds.map((tagId) => ({
          study_log_id: id,
          tag_id: tagId
        }))
      );

      for (const tagId of normalizedTagIds) {
        await recalcReview(tagId, accuracyRate, input.studied_at);
      }

      return { ...log, id };
    }
  );
}

export async function listStudyLogs(filter: StudyLogFilter = {}): Promise<StudyLog[]> {
  let logs = await db.study_logs.where('user_id').equals(USER_ID).toArray();

  if (filter.from) logs = logs.filter((log) => log.studied_at >= filter.from!);
  if (filter.to) logs = logs.filter((log) => log.studied_at <= filter.to!);
  if (filter.tag_id) {
    const logIds = new Set(
      (await db.study_log_tags.where('tag_id').equals(filter.tag_id).toArray()).map(
        (mapping) => mapping.study_log_id
      )
    );
    logs = logs.filter((log) => logIds.has(log.id!));
  }

  logs.sort((a, b) => b.studied_at.localeCompare(a.studied_at) || b.created_at.localeCompare(a.created_at));
  return attachTags(logs);
}

export async function getStudyLog(id: number): Promise<StudyLog> {
  const log = await db.study_logs.get(id);
  if (!log) throw new Error('学習ログが見つかりません。');
  return (await attachTags([log]))[0];
}

export async function listTags(): Promise<Tag[]> {
  return db.weak_area_tags.where('user_id').equals(USER_ID).sortBy('id');
}

export async function createTag(name: string): Promise<Tag> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('分野名を入力してください。');
  const existing = await db.weak_area_tags.where('name').equals(trimmedName).first();
  if (existing) return existing;
  const tag: Tag = {
    user_id: USER_ID,
    name: trimmedName,
    category: 'カスタム',
    created_at: new Date().toISOString()
  };
  const id = await db.weak_area_tags.add(tag);
  return { ...tag, id };
}

export async function getWeaknessSummary(): Promise<WeaknessSummary[]> {
  const [tags, mappings, allLogs] = await Promise.all([
    listTags(),
    db.study_log_tags.toArray(),
    db.study_logs.where('user_id').equals(USER_ID).toArray()
  ]);
  const logById = new Map(allLogs.map((log) => [log.id!, log]));
  const logIdsByTagId = new Map<number, Set<number>>();

  for (const mapping of mappings) {
    const current = logIdsByTagId.get(mapping.tag_id) ?? new Set<number>();
    current.add(mapping.study_log_id);
    logIdsByTagId.set(mapping.tag_id, current);
  }

  const summaries: WeaknessSummary[] = [];

  for (const tag of tags) {
    const logs = [...(logIdsByTagId.get(tag.id!) ?? [])]
      .map((logId) => logById.get(logId))
      .filter((log): log is StudyLog => Boolean(log));
    if (logs.length === 0) continue;

    logs.sort((a, b) => b.studied_at.localeCompare(a.studied_at) || b.created_at.localeCompare(a.created_at));
    const total = logs.reduce((sum, log) => sum + log.total_questions, 0);
    const correct = logs.reduce((sum, log) => sum + log.correct_count, 0);
    const recent = logs.slice(0, 3);
    const recentTotal = recent.reduce((sum, log) => sum + log.total_questions, 0);
    const recentCorrect = recent.reduce((sum, log) => sum + log.correct_count, 0);

    summaries.push({
      tag,
      total,
      accuracy: total ? Math.round((correct / total) * 1000) / 10 : 0,
      recentAccuracy: recentTotal ? Math.round((recentCorrect / recentTotal) * 1000) / 10 : 0
    });
  }

  return summaries.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

export async function listDueReviews(asOf = toLocalDateString()): Promise<ReviewSchedule[]> {
  const schedules = await db.review_schedules
    .where('next_review_date')
    .belowOrEqual(asOf)
    .sortBy('next_review_date');
  return attachReviewTags(schedules);
}

export async function listAllReviews(): Promise<ReviewSchedule[]> {
  const schedules = await db.review_schedules.orderBy('next_review_date').toArray();
  return attachReviewTags(schedules);
}

async function attachReviewTags(schedules: ReviewSchedule[]): Promise<ReviewSchedule[]> {
  const tagIds = [...new Set(schedules.map((schedule) => schedule.tag_id))];
  const tags = (await db.weak_area_tags.bulkGet(tagIds)).filter(
    (tag): tag is Tag => Boolean(tag)
  );
  const tagById = new Map(tags.map((tag) => [tag.id!, tag]));
  return schedules.map((schedule) => ({ ...schedule, tag: tagById.get(schedule.tag_id) }));
}

export async function recalcReview(
  tagId: number,
  accuracyRate: number,
  reviewedAt = toLocalDateString()
): Promise<ReviewSchedule> {
  const current = await db.review_schedules.where('tag_id').equals(tagId).first();

  // 履歴の後追い入力はログとして保存するが、現在の復習状態は巻き戻さない。
  // 既存の最終学習日より古い日付なら、last_reviewed_atを含めてスケジュール更新を行わない。
  if (current && isHistoricalReview(reviewedAt, current.last_reviewed_at)) {
    return current;
  }

  const result = calculateReview({
    repetition: current?.repetition ?? 0,
    intervalDays: current?.interval_days ?? 1,
    easeFactor: current?.ease_factor ?? 2.5,
    accuracyRate,
    reviewedAt
  });
  const schedule: ReviewSchedule = {
    ...(current?.id ? { id: current.id } : {}),
    user_id: USER_ID,
    tag_id: tagId,
    repetition: result.repetition,
    interval_days: result.intervalDays,
    ease_factor: result.easeFactor,
    last_reviewed_at: reviewedAt,
    next_review_date: result.nextReviewDate
  };

  if (current?.id) await db.review_schedules.put(schedule);
  else schedule.id = await db.review_schedules.add(schedule);
  return schedule;
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.app_settings.get(1);
  if (!settings) throw new Error('設定が初期化されていません。');
  return settings;
}

export async function updateLinkOpenMode(mode: LinkOpenMode): Promise<AppSettings> {
  if (mode !== 'webview' && mode !== 'external_browser') {
    throw new Error('開き方の指定が不正です。');
  }
  const settings: AppSettings = {
    id: 1,
    user_id: USER_ID,
    link_open_mode: mode,
    updated_at: new Date().toISOString()
  };
  await db.app_settings.put(settings);
  return settings;
}

export async function listLinks(category?: string): Promise<SavedLink[]> {
  const links = category
    ? await db.saved_links.where('category').equals(category).toArray()
    : await db.saved_links.where('user_id').equals(USER_ID).toArray();
  return links.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}

export async function createLink(
  input: Omit<SavedLink, 'id' | 'user_id' | 'created_at'>
): Promise<SavedLink> {
  validateLink(input);
  const link: SavedLink = {
    user_id: USER_ID,
    title: input.title.trim(),
    url: input.url.trim(),
    description: input.description?.trim() || undefined,
    category: input.category?.trim() || undefined,
    created_at: new Date().toISOString()
  };
  const id = await db.saved_links.add(link);
  return { ...link, id };
}

export async function updateLink(
  id: number,
  input: Partial<Omit<SavedLink, 'id' | 'user_id' | 'created_at'>>
): Promise<SavedLink> {
  const current = await db.saved_links.get(id);
  if (!current) throw new Error('リンクが見つかりません。');
  const updated = { ...current, ...input };
  validateLink(updated);
  await db.saved_links.put(updated);
  return updated;
}

export async function deleteLink(id: number): Promise<void> {
  await db.saved_links.delete(id);
}

function validateLink(input: Pick<SavedLink, 'title' | 'url'>): void {
  if (!input.title.trim()) throw new Error('リンク名を入力してください。');
  try {
    const url = new URL(input.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
  } catch {
    throw new Error('http または https の有効なURLを入力してください。');
  }
}

export async function getDailySummary(date = toLocalDateString()): Promise<DailySummary> {
  const logs = await db.study_logs.where('studied_at').equals(date).toArray();
  const studyTime = logs.reduce((sum, log) => sum + log.study_time_min, 0);
  const totalQuestions = logs.reduce((sum, log) => sum + log.total_questions, 0);
  const correctCount = logs.reduce((sum, log) => sum + log.correct_count, 0);
  return {
    studied_at: date,
    studyTime,
    totalQuestions,
    correctCount,
    accuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0
  };
}
