import { AlertCircle, Calculator, CheckCircle2, Save } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStudyLog, listTags } from '../db/api';
import { PageHeader } from '../components/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { toLocalDateString } from '../logic/date';
import { validateStudyLog } from '../logic/validation';

export function NewLogPage() {
  const navigate = useNavigate();
  const { data: tags = [], loading } = useAsync(listTags, []);
  const [studiedAt, setStudiedAt] = useState(toLocalDateString());
  const [studyTime, setStudyTime] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [correctCount, setCorrectCount] = useState(0);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;
  const groupedTags = useMemo(
    () =>
      Object.entries(
        tags.reduce<Record<string, typeof tags>>((groups, tag) => {
          const category = tag.category ?? 'その他';
          groups[category] = [...(groups[category] ?? []), tag];
          return groups;
        }, {})
      ),
    [tags]
  );

  function toggleTag(id: number) {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = {
      studied_at: studiedAt,
      study_time_min: studyTime,
      total_questions: totalQuestions,
      correct_count: correctCount,
      tag_ids: tagIds,
      wrong_reason_note: note
    };
    const nextErrors = validateStudyLog(input);
    setErrors(nextErrors);
    if (nextErrors.length) return;

    setSaving(true);
    try {
      await createStudyLog(input);
      navigate('/', { replace: true });
    } catch (reason) {
      setErrors([reason instanceof Error ? reason.message : '保存に失敗しました。']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="学習ログ登録"
        description="過去問道場での演習結果を手入力します。正答率と復習予定は保存時に自動計算されます。"
      />

      <form className="grid gap-6 lg:grid-cols-[1fr_0.8fr]" onSubmit={submit}>
        <div className="space-y-6">
          <section className="card">
            <h2 className="text-lg font-bold">演習結果</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label">学習日 *</span>
                <input
                  type="date"
                  className="input"
                  max={toLocalDateString()}
                  value={studiedAt}
                  onChange={(event) => setStudiedAt(event.target.value)}
                  required
                />
              </label>
              <label>
                <span className="label">学習時間（分）*</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                  value={studyTime}
                  onChange={(event) => setStudyTime(Number(event.target.value))}
                  required
                />
              </label>
              <label>
                <span className="label">問題数 *</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                  value={totalQuestions}
                  onChange={(event) => setTotalQuestions(Number(event.target.value))}
                  required
                />
              </label>
              <label>
                <span className="label">正解数 *</span>
                <input
                  type="number"
                  min="0"
                  max={Math.max(totalQuestions, 0)}
                  step="1"
                  className="input"
                  value={correctCount}
                  onChange={(event) => setCorrectCount(Number(event.target.value))}
                  required
                />
              </label>
            </div>
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-brand-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-700">
                <Calculator />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-800">自動計算の正答率</p>
                <p className="text-2xl font-black text-brand-900">{accuracy}%</p>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-bold">間違えた理由メモ</h2>
            <p className="mt-1 text-sm text-slate-600">
              知識不足、読み違い、計算ミスなど、次回見直したい点を残せます。
            </p>
            <textarea
              className="input mt-4 min-h-32 resize-y"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例：用語の定義を曖昧に覚えていた。選択肢を最後まで読まなかった。"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <h2 className="text-lg font-bold">分野タグ *</h2>
            <p className="mt-1 text-sm text-slate-600">演習した分野を1つ以上選択してください。</p>
            <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>
                複数タグを付けた場合、問題数・正解数の全量を各タグへ計上します。そのため、分野別問題数の合計は実際の演習問題数と一致しないことがあります。
              </p>
            </div>
            {loading ? (
              <p className="mt-5 text-sm text-slate-500">分野を読み込み中...</p>
            ) : (
              <div className="mt-5 space-y-5">
                {groupedTags.map(([category, categoryTags]) => (
                  <fieldset key={category}>
                    <legend className="mb-2 text-sm font-bold text-slate-700">{category}</legend>
                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag) => {
                        const checked = tagIds.includes(tag.id!);
                        return (
                          <label
                            key={tag.id}
                            className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold transition ${
                              checked
                                ? 'border-brand-600 bg-brand-700 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleTag(tag.id!)}
                            />
                            {tag.name}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          </section>

          {errors.length > 0 && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">入力内容を確認してください</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </section>
          )}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? <CheckCircle2 className="animate-pulse" /> : <Save />}
            {saving ? '保存中...' : 'ログを保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
