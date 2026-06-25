import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { getWeaknessSummary, listStudyLogs } from '../db/api';
import { useAsync } from '../hooks/useAsync';

export function DashboardPage() {
  const { data, loading, error } = useAsync(async () => {
    const [logs, weakness] = await Promise.all([listStudyLogs(), getWeaknessSummary()]);
    return { logs, weakness };
  }, []);

  const chronologicalLogs = [...(data?.logs ?? [])].reverse();
  const accuracyData = chronologicalLogs.map((log) => ({
    date: log.studied_at.slice(5).replace('-', '/'),
    accuracy: log.accuracy_rate
  }));
  const dailyMap = chronologicalLogs.reduce<Record<string, number>>((map, log) => {
    map[log.studied_at] = (map[log.studied_at] ?? 0) + log.study_time_min;
    return map;
  }, {});
  const studyTimeData = Object.entries(dailyMap).map(([date, minutes]) => ({
    date: date.slice(5).replace('-', '/'),
    minutes
  }));
  const categoryMap = (data?.weakness ?? []).reduce<
    Record<string, { weightedCorrect: number; total: number }>
  >((map, summary) => {
    const category = summary.tag.category ?? 'その他';
    const current = map[category] ?? { weightedCorrect: 0, total: 0 };
    current.weightedCorrect += (summary.accuracy / 100) * summary.total;
    current.total += summary.total;
    map[category] = current;
    return map;
  }, {});
  const categoryData = Object.entries(categoryMap).map(([category, value]) => ({
    category,
    accuracy: value.total ? Math.round((value.weightedCorrect / value.total) * 1000) / 10 : 0
  }));

  return (
    <div>
      <PageHeader title="ダッシュボード" description="学習量と正答率の変化をグラフで確認します。" />
      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">集計中...</p>
      ) : !data?.logs.length ? (
        <EmptyState
          icon={BarChart3}
          title="グラフに表示するデータがありません"
          description="学習ログを登録すると、正答率と学習時間の推移が表示されます。"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="正答率推移">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, '正答率']} />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={{ fill: '#0f766e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="日別学習時間">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis unit="分" />
                <Tooltip formatter={(value) => [`${value}分`, '学習時間']} />
                <Bar dataKey="minutes" fill="#2563eb" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="系統別正答率" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, '正答率']} />
                <Legend />
                <Bar name="正答率" dataKey="accuracy" fill="#f59e0b" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  className = '',
  children
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`card ${className}`}>
      <h2 className="mb-5 text-lg font-bold">{title}</h2>
      <p className="mb-2 text-xs text-slate-500 sm:hidden">グラフは横にスワイプできます。</p>
      <div className="mobile-scroll">
        <div className="h-72 min-w-[500px] sm:min-w-0">{children}</div>
      </div>
    </section>
  );
}
