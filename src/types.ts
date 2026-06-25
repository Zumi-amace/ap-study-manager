export type LinkOpenMode = 'webview' | 'external_browser';

export interface User {
  id: number;
  display_name?: string | null;
  created_at: string;
}

export interface StudyLog {
  id?: number;
  user_id: number;
  studied_at: string;
  study_time_min: number;
  total_questions: number;
  correct_count: number;
  accuracy_rate: number;
  wrong_reason_note?: string;
  created_at: string;
  tags?: Tag[];
}

export interface Tag {
  id?: number;
  user_id: number;
  name: string;
  category?: string;
  created_at: string;
}

export interface StudyLogTag {
  id?: number;
  study_log_id: number;
  tag_id: number;
}

export interface ReviewSchedule {
  id?: number;
  user_id: number;
  tag_id: number;
  repetition: number;
  interval_days: number;
  ease_factor: number;
  last_reviewed_at?: string;
  next_review_date: string;
  tag?: Tag;
}

export interface AppSettings {
  id: number;
  user_id: number;
  link_open_mode: LinkOpenMode;
  updated_at: string;
}

export interface SavedLink {
  id?: number;
  user_id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  created_at: string;
}

export interface CreateStudyLogInput {
  studied_at: string;
  study_time_min: number;
  total_questions: number;
  correct_count: number;
  tag_ids: number[];
  wrong_reason_note?: string;
}

export interface StudyLogFilter {
  from?: string;
  to?: string;
  tag_id?: number;
}

export interface WeaknessSummary {
  tag: Tag;
  total: number;
  accuracy: number;
  recentAccuracy: number;
}

export interface DailySummary {
  studied_at: string;
  studyTime: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
}
