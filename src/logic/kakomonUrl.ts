import type { KakomonDisplayMode } from '../types';

const KAKOMON_HOSTS = new Set(['ap-siken.com', 'www.ap-siken.com']);

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
