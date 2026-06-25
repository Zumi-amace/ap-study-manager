import Dexie, { type EntityTable } from 'dexie';
import type {
  AppSettings,
  ReviewSchedule,
  SavedLink,
  StudyLog,
  StudyLogTag,
  Tag,
  User
} from '../types';

class APStudyDatabase extends Dexie {
  users!: EntityTable<User, 'id'>;
  study_logs!: EntityTable<StudyLog, 'id'>;
  weak_area_tags!: EntityTable<Tag, 'id'>;
  study_log_tags!: EntityTable<StudyLogTag, 'id'>;
  review_schedules!: EntityTable<ReviewSchedule, 'id'>;
  app_settings!: EntityTable<AppSettings, 'id'>;
  saved_links!: EntityTable<SavedLink, 'id'>;

  constructor() {
    super('ap-study-manager');
    this.version(1).stores({
      users: 'id',
      study_logs: '++id, user_id, studied_at, created_at',
      weak_area_tags: '++id, user_id, name, category',
      study_log_tags: '++id, study_log_id, tag_id, [study_log_id+tag_id]',
      review_schedules: '++id, user_id, &tag_id, next_review_date',
      app_settings: 'id, user_id',
      saved_links: '++id, user_id, category, created_at'
    });
  }
}

export const db = new APStudyDatabase();
