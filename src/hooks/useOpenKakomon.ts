import { useNavigate } from 'react-router-dom';
import { getSettings } from '../db/api';
import { toKakomonDisplayUrl } from '../logic/kakomonUrl';

export function openExternalBrowser(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function useOpenKakomon() {
  const navigate = useNavigate();

  return async (url: string) => {
    const settings = await getSettings();
    const displayUrl = toKakomonDisplayUrl(
      url,
      settings.kakomon_display_mode ?? 'mobile'
    );
    if (settings.link_open_mode === 'webview') {
      navigate(`/study?url=${encodeURIComponent(displayUrl)}`);
    } else {
      openExternalBrowser(displayUrl);
    }
  };
}
