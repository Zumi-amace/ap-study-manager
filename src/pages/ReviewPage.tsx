import { BookOpen, CalendarCheck, Clock3, RefreshCw, Target } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { listAllReviews, listLinks, rebuildReviewSchedules } from '../db/api';
import { useAsync } from '../hooks/useAsync';
import { useOpenKakomon } from '../hooks/useOpenKakomon';
import { formatDate, toLocalDateString } from '../logic/date';
import type { SavedLink } from '../types';

export function ReviewPage() {
  const openKakomon = useOpenKakomon();
  const today = toLocalDateString();
  const { data, loading, error, reload } = useAsync(async () => {
    const [reviews, links] = await Promise.all([listAllReviews(), listLinks()]);
    return { reviews, links };
  }, []);
  const [repairing, setRepairing] = useState(false);
  const [repairMessage, setRepairMessage] = useState('');

  async function repairReviews() {
    setRepairing(true);
    setRepairMessage('');
    try {
      await rebuildReviewSchedules();
      reload();
      setRepairMessage('学習履歴から復習予定を再計算しました。');
    } catch (reason) {
      setRepairMessage(
        reason instanceof Error ? reason.message : '復習予定の再計算に失敗しました。'
      );
    } finally {
      setRepairing(false);
    }
  }

  function linkFor(tagName: string): SavedLink | undefined {
    return (
      data?.links.find((link) => link.category === tagName || link.title.includes(tagName)) ??
      data?.links[0]
    );
  }

  return (
    <div>
      <PageHeader
        title="復習予定"
        description="分野ごとの演習結果から、SM-2簡略版で次回復習日を提案します。"
        action={
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            disabled={repairing}
            onClick={repairReviews}
          >
            <RefreshCw size={18} className={repairing ? 'animate-spin' : ''} />
            {repairing ? '再計算中...' : '予定を再計算'}
          </button>
        }
      />

      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {repairMessage && (
        <p className="mb-5 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-800">
          {repairMessage}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : !data?.reviews.length ? (
        <EmptyState
          icon={CalendarCheck}
          title="復習予定はまだありません"
          description="学習ログを登録した分野だけが復習管理の対象になります。"
        />
      ) : (
        <div className="grid gap-4">
          {data.reviews.map((review) => {
            const overdue = review.next_review_date < today;
            const dueToday = review.next_review_date === today;
            const link = linkFor(review.tag?.name ?? '');
            return (
              <article
                key={review.id}
                className={`card flex flex-col gap-5 sm:flex-row sm:items-center ${
                  overdue ? 'border-red-300 bg-red-50/60' : dueToday ? 'border-amber-300 bg-amber-50/60' : ''
                }`}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                    overdue
                      ? 'bg-red-100 text-red-700'
                      : dueToday
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  <Target />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{review.tag?.name ?? '不明な分野'}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        overdue
                          ? 'bg-red-100 text-red-700'
                          : dueToday
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {overdue ? '期限超過' : dueToday ? '今日が期限' : '期限内'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={15} />
                      前回：{formatDate(review.last_reviewed_at)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarCheck size={15} />
                      次回：{formatDate(review.next_review_date)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    間隔 {review.interval_days}日・連続成功 {review.repetition}回
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary w-full shrink-0 sm:w-auto"
                  disabled={!link}
                  onClick={() => link && openKakomon(link.url)}
                >
                  <BookOpen size={18} />
                  この分野を演習
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
