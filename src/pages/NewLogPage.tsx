import { AlertCircle, BrainCircuit, Calculator, CheckCircle2, Save, Wand2 } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStudyLog, getSettings, listTags } from '../db/api';
import { PageHeader } from '../components/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { extractStudyResult, generateAiAssist } from '../logic/ai';
import { toLocalDateString } from '../logic/date';
import { validateStudyLog } from '../logic/validation';

export function NewLogPage() {
  const navigate = useNavigate();
  const { data, loading } = useAsync(async () => {
    const [tags, settings] = await Promise.all([listTags(), getSettings()]);
    return { tags, settings };
  }, []);
  const tags = data?.tags ?? [];
  const anthropicApiKey = data?.settings.anthropic_api_key ?? '';
  const [studiedAt, setStudiedAt] = useState(toLocalDateString());
  const [studyTime, setStudyTime] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [correctCount, setCorrectCount] = useState(0);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [assistMessage, setAssistMessage] = useState('');
  const [assistError, setAssistError] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
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

  function applyExtractedValues() {
    setAssistError('');
    setAssistMessage('');
    const extracted = extractStudyResult(pastedText);
    const hasTotal = extracted.totalQuestions !== undefined;
    const hasCorrect = extracted.correctCount !== undefined;

    if (hasTotal) setTotalQuestions(extracted.totalQuestions!);
    if (hasCorrect) setCorrectCount(extracted.correctCount!);

    if (hasTotal && hasCorrect) {
      setAssistMessage(`問題数 ${extracted.totalQuestions} 問、正解数 ${extracted.correctCount} 問をフォームへ反映しました。保存前に内容を確認してください。`);
      return;
    }

    setAssistError('問題数と正解数を抽出できませんでした。貼り付け内容を確認するか、手入力してください。');
  }

  async function runAiAssist() {
    setAssistError('');
    setAssistMessage('');
    setAiExplanation('');
    if (!pastedText.trim()) {
      setAssistError('採点画面のテキストを貼り付けてください。');
      return;
    }

    const extracted = extractStudyResult(pastedText);
    if (extracted.totalQuestions !== undefined) setTotalQuestions(extracted.totalQuestions);
    if (extracted.correctCount !== undefined) setCorrectCount(extracted.correctCount);
    setGeneratingAi(true);
    try {
      const result = await generateAiAssist({
        pastedText,
        apiKey: anthropicApiKey
      });
      if (result.totalQuestions !== undefined) setTotalQuestions(result.totalQuestions);
      if (result.correctCount !== undefined) setCorrectCount(result.correctCount);
      setAiExplanation(result.explanation);
      setAssistMessage('AI解説を生成しました。問題数・正解数が抽出できた場合はフォームへ反映済みです。');
    } catch (reason) {
      setAssistError(reason instanceof Error ? reason.message : 'AI解説の生成に失敗しました。');
    } finally {
      setGeneratingAi(false);
    }
  }

  function appendAiExplanationToNote() {
    if (!aiExplanation.trim()) return;
    const nextNote = note.trim()
      ? `${note.trim()}\n\n--- AIアシスト ---\n${aiExplanation}`
      : `--- AIアシスト ---\n${aiExplanation}`;
    setNote(nextNote);
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

      <section className="card mb-5 sm:mb-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <BrainCircuit size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold">AIアシスト</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              過去問道場の採点画面や振り返りメモを貼り付けると、問題数・正解数を抽出し、復習のヒントを生成します。
              iframe内のDOMは読み取りません。
            </p>
          </div>
        </div>
        <textarea
          className="input mt-4 min-h-40 resize-y"
          value={pastedText}
          onChange={(event) => setPastedText(event.target.value)}
          placeholder="例：10問中8問正解、正答率80%。セキュリティとネットワークで迷った..."
        />
        <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={applyExtractedValues}>
            <Calculator size={18} />
            問題数/正解数を反映
          </button>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto"
            onClick={runAiAssist}
            disabled={generatingAi}
          >
            <Wand2 size={18} className={generatingAi ? 'animate-pulse' : ''} />
            {generatingAi ? 'AI生成中...' : 'AI解説を生成'}
          </button>
        </div>
        {!anthropicApiKey && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            AI解説生成には設定画面でAnthropic APIキーの保存が必要です。数値抽出だけならAPIキーなしで使えます。
          </p>
        )}
        {assistMessage && (
          <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm font-semibold text-brand-800">{assistMessage}</p>
        )}
        {assistError && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{assistError}</p>
        )}
        {aiExplanation && (
          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="font-bold text-violet-950">生成された解説</h3>
              <button type="button" className="btn-secondary w-full bg-white px-3 text-sm sm:w-auto" onClick={appendAiExplanationToNote}>
                メモへ追加
              </button>
            </div>
            <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-violet-950">
              {aiExplanation}
            </div>
          </div>
        )}
      </section>

      <form className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[1fr_0.8fr]" onSubmit={submit}>
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <section className="card">
            <h2 className="text-lg font-bold">演習結果</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="min-w-0">
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
              <label className="min-w-0">
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
              <label className="min-w-0">
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
              <label className="min-w-0">
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

        <div className="min-w-0 space-y-5 sm:space-y-6">
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
                            className={`flex min-h-11 max-w-full cursor-pointer items-center break-words rounded-xl border px-3 py-2 text-sm font-semibold transition ${
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

          <button type="submit" className="btn-primary min-h-12 w-full" disabled={saving}>
            {saving ? <CheckCircle2 className="animate-pulse" /> : <Save />}
            {saving ? '保存中...' : 'ログを保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
