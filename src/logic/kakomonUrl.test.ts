import { describe, expect, it } from 'vitest';
import { toKakomonDisplayUrl } from './kakomonUrl';

describe('toKakomonDisplayUrl', () => {
  it('PC版URLをモバイル版へ変換する', () => {
    expect(
      toKakomonDisplayUrl('https://www.ap-siken.com/apkakomon.php', 'mobile')
    ).toBe('https://www.ap-siken.com/s/apkakomon.php');
  });

  it('モバイル版URLをPC版へ変換する', () => {
    expect(
      toKakomonDisplayUrl('https://www.ap-siken.com/s/apkakomon.php', 'desktop')
    ).toBe('https://www.ap-siken.com/apkakomon.php');
  });

  it('クエリとハッシュを維持する', () => {
    expect(
      toKakomonDisplayUrl('https://www.ap-siken.com/apkakomon.php?a=1#start', 'mobile')
    ).toBe('https://www.ap-siken.com/s/apkakomon.php?a=1#start');
  });

  it('他サイトの保存リンクは変更しない', () => {
    const url = 'https://example.com/something';
    expect(toKakomonDisplayUrl(url, 'mobile')).toBe(url);
  });
});
