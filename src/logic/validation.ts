import type { CreateStudyLogInput } from '../types';
import { toLocalDateString } from './date';

export function validateStudyLog(input: CreateStudyLogInput): string[] {
  const errors: string[] = [];

  if (!input.studied_at) errors.push('学習日は必須です。');
  if (input.studied_at > toLocalDateString()) errors.push('未来日は指定できません。');
  if (!Number.isInteger(input.study_time_min) || input.study_time_min < 1) {
    errors.push('学習時間は1分以上の整数で入力してください。');
  }
  if (!Number.isInteger(input.total_questions) || input.total_questions < 1) {
    errors.push('問題数は1問以上の整数で入力してください。');
  }
  if (!Number.isInteger(input.correct_count) || input.correct_count < 0) {
    errors.push('正解数は0以上の整数で入力してください。');
  }
  if (input.correct_count > input.total_questions) {
    errors.push('正解数は問題数以下にしてください。');
  }
  if (input.tag_ids.length === 0) errors.push('分野タグを1つ以上選択してください。');

  return errors;
}
