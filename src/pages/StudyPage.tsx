import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { openExternalBrowser } from '../hooks/useOpenKakomon';

const DEFAULT_URL = 'https://www.ap-siken.com/apkakomon.php';

function safeUrl(raw: string | null): string {
  if (!raw) return DEFAULT_URL;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

export function StudyPage() {
  const [params] = useSearchParams();
  const url = safeUrl(params.get('url'));

  return (
    <div className="-m-3 flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col overflow-hidden sm:-m-6 lg:-m-8">
      <div className="border-b border-slate-200 bg-white p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <Link to="/" className="btn-secondary w-full sm:w-auto">
            <ArrowLeft size={18} />
            戻る
          </Link>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => openExternalBrowser(url)}>
            <ExternalLink size={18} />
            外部ブラウザで開く
          </button>
        </div>
        <div className="mt-3 flex min-w-0 gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 sm:text-sm">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <p className="min-w-0 break-words">
            サイト側の設定やCookie制限により、アプリ内表示が使えない場合があります。その場合は上の「外部ブラウザで開く」を利用してください。
          </p>
        </div>
      </div>
      <iframe
        title="応用情報 過去問道場"
        src={url}
        className="min-h-0 w-full min-w-0 flex-1 border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
