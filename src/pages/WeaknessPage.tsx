import { AlertCircle, Target } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { getWeaknessSummary } from '../db/api';
import { useAsync } from '../hooks/useAsync';

export function WeaknessPage() {
  const { data: summaries = [], loading, error } = useAsync(getWeaknessSummary, []);
  const chartData = summaries.map((summary) => ({
    name: summary.tag.name,
    accuracy: summary.accuracy
  }));

  return (
    <div>
      <PageHeader
        title="弱点分析"
        description="累計正答率が低い順に表示します。直近正答率は各分野の直近3ログを、正解数合計÷問題数合計で算出します。"
      />

      <div className="mb-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        <p>
          複数タグ付きログは、問題数・正解数の全量を各タグへ計上しています。そのため、分野別問題数の合計は実際の演習問題数と一致しないことがあります。
        </p>
      </div>

      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">集計中...</p>
      ) : summaries.length === 0 ? (
        <EmptyState
          icon={Target}
          title="分析できるデータがありません"
          description="分野タグ付きの学習ログを登録すると、ここに弱点が表示されます。"
        />
      ) : (
        <>
          <section className="card">
            <h2 className="mb-5 text-lg font-bold">分野別正答率</h2>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value}%`, '正答率']} />
                  <Bar dataKey="accuracy" fill="#0f766e" radius={[0, 7, 7, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card mt-6 overflow-x-auto p-0">
            <table className="w-full min-w-[660px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">分野</th>
                  <th className="px-5 py-3 font-semibold">系統</th>
                  <th className="px-5 py-3 text-right font-semibold">累計問題数</th>
                  <th className="px-5 py-3 text-right font-semibold">累計正答率</th>
                  <th className="px-5 py-3 text-right font-semibold">直近3ログ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((summary) => (
                  <tr key={summary.tag.id}>
                    <td className="px-5 py-4 font-semibold">{summary.tag.name}</td>
                    <td className="px-5 py-4 text-slate-500">{summary.tag.category}</td>
                    <td className="px-5 py-4 text-right">{summary.total}問</td>
                    <td className="px-5 py-4 text-right font-bold">{summary.accuracy}%</td>
                    <td className="px-5 py-4 text-right">{summary.recentAccuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
