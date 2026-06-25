import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { listStudyLogs, listTags } from '../db/api';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../logic/date';

export function HistoryPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tagId, setTagId] = useState('');
  const [expandedId, setExpandedId] = useState<number>();
  const filter = useMemo(
    () => ({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(tagId ? { tag_id: Number(tagId) } : {})
    }),
    [from, to, tagId]
  );
  const { data: logs = [], loading, error } = useAsync(() => listStudyLogs(filter), [from, to, tagId]);
  const { data: tags = [] } = useAsync(listTags, []);

  return (
    <div>
      <PageHeader title="学習履歴" description="過去の演習結果を時系列で振り返ります。" />

      <section className="card mb-6 grid gap-4 sm:grid-cols-3">
        <label>
          <span className="label">開始日</span>
          <input type="date" className="input" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          <span className="label">終了日</span>
          <input type="date" className="input" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          <span className="label">分野</span>
          <select className="input" value={tagId} onChange={(event) => setTagId(event.target.value)}>
            <option value="">すべて</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="該当する学習ログがありません"
          description="条件を変えるか、演習後に最初の学習ログを登録してください。"
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const expanded = expandedId === log.id;
            return (
              <article key={log.id} className="card p-0">
                <button
                  type="button"
                  className="flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center"
                  onClick={() => setExpandedId(expanded ? undefined : log.id)}
                >
                  <div className="min-w-32">
                    <p className="text-sm text-slate-500">{formatDate(log.studied_at)}</p>
                    <p className="mt-1 font-bold">{log.study_time_min}分</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {log.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {log.correct_count}/{log.total_questions}問正解
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <p className="text-2xl font-black text-slate-950">{log.accuracy_rate}%</p>
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700">間違えた理由メモ</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {log.wrong_reason_note || 'メモはありません。'}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
