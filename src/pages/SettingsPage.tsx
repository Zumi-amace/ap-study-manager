import { Edit3, ExternalLink, Link2, Plus, Save, Trash2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import {
  createLink,
  deleteLink,
  getSettings,
  listLinks,
  updateLink,
  updateLinkOpenMode
} from '../db/api';
import { PageHeader } from '../components/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { useOpenKakomon } from '../hooks/useOpenKakomon';
import type { LinkOpenMode, SavedLink } from '../types';

type LinkForm = Pick<SavedLink, 'title' | 'url' | 'description' | 'category'>;
const emptyForm: LinkForm = { title: '', url: '', description: '', category: '' };

export function SettingsPage() {
  const openKakomon = useOpenKakomon();
  const { data, loading, error, reload } = useAsync(async () => {
    const [settings, links] = await Promise.all([getSettings(), listLinks()]);
    return { settings, links };
  }, []);
  const [mode, setMode] = useState<LinkOpenMode>('external_browser');
  const [modeMessage, setModeMessage] = useState('');
  const [form, setForm] = useState<LinkForm>(emptyForm);
  const [editingId, setEditingId] = useState<number>();
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (data?.settings) setMode(data.settings.link_open_mode);
  }, [data?.settings]);

  async function saveMode(nextMode: LinkOpenMode) {
    setMode(nextMode);
    await updateLinkOpenMode(nextMode);
    setModeMessage('開き方を保存しました。');
    window.setTimeout(() => setModeMessage(''), 2500);
  }

  async function submitLink(event: FormEvent) {
    event.preventDefault();
    setFormError('');
    try {
      if (editingId) await updateLink(editingId, form);
      else await createLink(form);
      setForm(emptyForm);
      setEditingId(undefined);
      reload();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : '保存に失敗しました。');
    }
  }

  function editLink(link: SavedLink) {
    setEditingId(link.id);
    setForm({
      title: link.title,
      url: link.url,
      description: link.description ?? '',
      category: link.category ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeLink(id: number) {
    if (!window.confirm('このリンクを削除しますか？')) return;
    await deleteLink(id);
    reload();
  }

  return (
    <div>
      <PageHeader
        title="設定"
        description="過去問道場の開き方と、学習に使うリンクを管理します。"
      />

      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="card">
        <h2 className="text-lg font-bold">開き方のデフォルト</h2>
        <p className="mt-1 text-sm text-slate-600">過去問道場を開くときの既定動作を選択します。</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ModeOption
            checked={mode === 'webview'}
            title="WebView"
            description="アプリ内のiframeで表示します。"
            onChange={() => saveMode('webview')}
          />
          <ModeOption
            checked={mode === 'external_browser'}
            title="外部ブラウザ"
            description="安全な別タブで開きます。"
            onChange={() => saveMode('external_browser')}
          />
        </div>
        {modeMessage && <p className="mt-3 text-sm font-semibold text-brand-700">{modeMessage}</p>}
      </section>

      <section className="card mt-6">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
          </span>
          <div className="min-w-0">
            <h2 className="font-bold">{editingId ? 'リンクを編集' : 'リンクを追加'}</h2>
            <p className="text-sm text-slate-500">分野別ページなど、よく使うURLを保存できます。</p>
          </div>
        </div>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitLink}>
          <label>
            <span className="label">表示名 *</span>
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label>
            <span className="label">カテゴリ</span>
            <input
              className="input"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="例：演習、セキュリティ"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label">URL *</span>
            <input
              type="url"
              className="input"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://..."
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label">説明</span>
            <input
              className="input"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          {formError && <p className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <div className="grid gap-2 sm:col-span-2 sm:flex sm:flex-wrap">
            <button type="submit" className="btn-primary w-full sm:w-auto">
              <Save size={18} />
              {editingId ? '変更を保存' : 'リンクを追加'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={() => {
                  setEditingId(undefined);
                  setForm(emptyForm);
                }}
              >
                <X size={18} />
                キャンセル
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold">保存済みリンク</h2>
        {loading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : (
          <div className="grid gap-3">
            {data?.links.map((link) => (
              <article key={link.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Link2 size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{link.title}</h3>
                    {link.category && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                        {link.category}
                      </span>
                    )}
                  </div>
                  {link.description && <p className="mt-1 text-sm text-slate-600">{link.description}</p>}
                  <p className="mt-1 truncate text-xs text-slate-400">{link.url}</p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-3 sm:flex sm:w-auto sm:flex-wrap">
                  <button type="button" className="btn-secondary w-full px-3 sm:w-auto" onClick={() => openKakomon(link.url)}>
                    <ExternalLink size={17} />
                    開く
                  </button>
                  <button type="button" className="btn-secondary w-full px-3 sm:w-auto" onClick={() => editLink(link)}>
                    <Edit3 size={17} />
                    編集
                  </button>
                  <button type="button" className="btn-danger min-h-11 w-full sm:w-auto" onClick={() => removeLink(link.id!)}>
                    <Trash2 size={17} />
                    削除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ModeOption({
  checked,
  title,
  description,
  onChange
}: {
  checked: boolean;
  title: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex min-h-16 cursor-pointer gap-3 rounded-xl border p-4 transition ${
        checked ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input type="radio" name="open-mode" checked={checked} onChange={onChange} className="mt-1 accent-teal-700" />
      <span>
        <span className="block font-bold">{title}</span>
        <span className="mt-1 block text-sm text-slate-600">{description}</span>
      </span>
    </label>
  );
}
