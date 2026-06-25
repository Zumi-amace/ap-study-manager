import type { KakomonDisplayMode } from '../types';

const KAKOMON_HOSTS = new Set(['ap-siken.com', 'www.ap-siken.com']);
export const DEFAULT_KAKOMON_URL = 'https://www.ap-siken.com/s/apkakomon.php';

export function safeKakomonUrl(raw: string | null): string {
  if (!raw) return DEFAULT_KAKOMON_URL;

  try {
    const parsed = new URL(raw);
    const isAllowedScheme = parsed.protocol === 'https:';
    const isAllowedHost = KAKOMON_HOSTS.has(parsed.hostname);
    return isAllowedScheme && isAllowedHost
      ? parsed.toString()
      : DEFAULT_KAKOMON_URL;
  } catch {
    return DEFAULT_KAKOMON_URL;
  }
}

export function toKakomonDisplayUrl(url: string, mode: KakomonDisplayMode): string {
  try {
    const parsed = new URL(url);
    if (!KAKOMON_HOSTS.has(parsed.hostname)) return url;

    const pathWithoutMobilePrefix = parsed.pathname.replace(/^\/s(?=\/|$)/, '');
    parsed.pathname =
      mode === 'mobile'
        ? `/s${pathWithoutMobilePrefix.startsWith('/') ? pathWithoutMobilePrefix : `/${pathWithoutMobilePrefix}`}`
        : pathWithoutMobilePrefix || '/';
    return parsed.toString();
  } catch {
    return url;
  }
}
