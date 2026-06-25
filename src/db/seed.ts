import { db } from './database';
import type { Tag } from '../types';

const categories: Array<[string, string[]]> = [
  [
    'テクノロジ系',
    [
      '基礎理論',
      'アルゴリズムとプログラミング',
      'コンピュータ構成要素',
      'システム構成要素',
      'ソフトウェア',
      'ハードウェア',
      'ヒューマンインタフェース',
      'マルチメディア',
      'データベース',
      'ネットワーク',
      'セキュリティ',
      'システム開発技術',
      'ソフトウェア開発管理技術'
    ]
  ],
  ['マネジメント系', ['プロジェクトマネジメント', 'サービスマネジメント', 'システム監査']],
  [
    'ストラテジ系',
    [
      'システム戦略',
      'システム企画',
      '経営戦略マネジメント',
      '技術戦略マネジメント',
      'ビジネスインダストリ',
      '企業活動',
      '法務'
    ]
  ]
];

export async function seedDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [db.users, db.app_settings, db.weak_area_tags, db.saved_links],
    async () => {
      const now = new Date().toISOString();

      if ((await db.users.count()) === 0) {
        await db.users.add({ id: 1, display_name: null, created_at: now });
      }

      if ((await db.app_settings.count()) === 0) {
        await db.app_settings.add({
          id: 1,
          user_id: 1,
          link_open_mode: 'external_browser',
          updated_at: now
        });
      }

      if ((await db.weak_area_tags.count()) === 0) {
        const tags: Tag[] = categories.flatMap(([category, names], categoryIndex) => {
          const offset = categories
            .slice(0, categoryIndex)
            .reduce((sum, [, previousNames]) => sum + previousNames.length, 0);
          return names.map((name, index) => ({
            id: offset + index + 1,
            user_id: 1,
            name,
            category,
            created_at: now
          }));
        });
        await db.weak_area_tags.bulkAdd(tags);
      }

      if ((await db.saved_links.count()) === 0) {
        await db.saved_links.add({
          user_id: 1,
          title: '応用情報 過去問道場（トップ）',
          url: 'https://www.ap-siken.com/apkakomon.php',
          category: '演習',
          description: '応用情報技術者試験ドットコムの過去問道場',
          created_at: now
        });
      }
    }
  );
}
