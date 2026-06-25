import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Clock3,
  Settings,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDailySummary, listDueReviews, listLinks } from '../db/api';
import { useAsync } from '../hooks/useAsync';
import { useOpenKakomon } from '../hooks/useOpenKakomon';
import { PageHeader } from '../components/PageHeader';

export function HomePage() {
  const openKakomon = useOpenKakomon();
  const { data, loading, error } = useAsync(async () => {
    const [summary, reviews, links] = await Promise.all([
      getDailySummary(),
      listDueReviews(),
      listLinks()
    ]);
    return { summary, reviews, links };
  }, []);
  const primaryLink = data?.links[0];

  return (
    <div>
      <PageHeader
        title="今日の学習"
        description="演習は過去問道場で、記録と振り返りはここで。今日やることを小さく始めましょう。"
      />

      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Clock3}
          label="学習時間"
          value={loading ? '—' : `${data?.summary.studyTime ?? 0}分`}
          tone="teal"
        />
        <SummaryCard
          icon={BookOpenCheck}
          label="解いた問題"
          value={loading ? '—' : `${data?.summary.totalQuestions ?? 0}問`}
          tone="blue"
        />
        <SummaryCard
          icon={Target}
          label="正答率"
          value={loading ? '—' : `${data?.summary.accuracy ?? 0}%`}
          tone="amber"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card bg-gradient-to-br from-brand-800 to-brand-600 text-white">
          <p className="text-sm font-semibold text-brand-100">演習を始める</p>
          <h2 className="mt-2 text-2xl font-bold">過去問道場を開く</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-brand-50">
            設定した開き方で外部サイトを表示します。問題・解説データを本アプリが取得または保存することはありません。
          </p>
          <button
            type="button"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-brand-800 transition hover:bg-brand-50 disabled:opacity-50"
            disabled={!primaryLink}
            onClick={() => primaryLink && openKakomon(primaryLink.url)}
          >
            <BookOpen size={20} />
            過去問道場を開く
            <ArrowRight size={18} />
          </button>
          {!primaryLink && <p className="mt-3 text-xs text-brand-100">設定画面でリンクを登録してください。</p>}
        </div>

        <Link
          to="/review"
          className={`card group block transition hover:-translate-y-0.5 hover:border-brand-300 ${
            data?.reviews.length ? 'border-amber-300 bg-amber-50' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Target />
            </span>
            <ArrowRight className="text-slate-400 transition group-hover:translate-x-1" />
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-600">復習アラート</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{data?.reviews.length ?? 0}<span className="ml-1 text-base">分野</span></p>
          <p className="mt-2 text-sm text-slate-600">
            {data?.reviews.length ? '期限を迎えた分野があります。' : '期限を迎えた復習はありません。'}
          </p>
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold">学習メニュー</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MenuLink to="/log/new" icon={BookOpenCheck} label="学習ログ登録" />
          <MenuLink to="/weakness" icon={Target} label="弱点分析" />
          <MenuLink to="/dashboard" icon={BarChart3} label="ダッシュボード" />
          <MenuLink to="/settings" icon={Settings} label="設定・リンク管理" />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  tone: 'teal' | 'blue' | 'amber';
}) {
  const tones = {
    teal: 'bg-brand-50 text-brand-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700'
  };
  return (
    <div className="card flex items-center gap-4">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function MenuLink({
  to,
  icon: Icon,
  label
}: {
  to: string;
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="card flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <span className="flex items-center gap-3 font-semibold">
        <Icon size={20} className="text-brand-700" />
        {label}
      </span>
      <ArrowRight size={18} className="text-slate-400" />
    </Link>
  );
}
