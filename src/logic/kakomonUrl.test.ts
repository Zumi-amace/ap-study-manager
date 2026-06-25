import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KAKOMON_URL,
  safeKakomonUrl,
  toKakomonDisplayUrl
} from './kakomonUrl';

describe('safeKakomonUrl', () => {
  it.each([
    'https://www.ap-siken.com/apkakomon.php',
    'https://ap-siken.com/s/apkakomon.php'
  ])('HTTPSの許可ホストを受け入れる: %s', (url) => {
    expect(safeKakomonUrl(url)).toBe(url);
  });

  it('クエリ文字列とハッシュを維持する', () => {
    const url = 'https://www.ap-siken.com/s/apkakomon.php?mode=1#start';
    expect(safeKakomonUrl(url)).toBe(url);
  });

  it.each([
    'https://example.com/apkakomon.php',
    'javascript:alert(1)',
    'http://www.ap-siken.com/apkakomon.php',
    'not a valid url'
  ])('許可されないURLを既定URLへ戻す: %s', (url) => {
    expect(safeKakomonUrl(url)).toBe(DEFAULT_KAKOMON_URL);
  });

  it('空のURLを既定URLへ戻す', () => {
    expect(safeKakomonUrl(null)).toBe(DEFAULT_KAKOMON_URL);
  });
});

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
