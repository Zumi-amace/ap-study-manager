import { describe, expect, it } from 'vitest';
import { extractStudyResult } from './ai';

describe('extractStudyResult', () => {
  it('「10問中8問正解」形式から問題数と正解数を抽出する', () => {
    expect(extractStudyResult('結果: 10問中8問正解でした')).toEqual({
      totalQuestions: 10,
      correctCount: 8
    });
  });

  it('全角数字を半角に正規化して抽出する', () => {
    expect(extractStudyResult('８０問中６４問正答')).toEqual({
      totalQuestions: 80,
      correctCount: 64
    });
  });

  it('スラッシュ形式から抽出する', () => {
    expect(extractStudyResult('正解 7 / 10')).toEqual({
      totalQuestions: 10,
      correctCount: 7
    });
  });

  it('問題数と正解数のラベルから抽出する', () => {
    expect(extractStudyResult('問題数: 12 正解数: 9')).toEqual({
      totalQuestions: 12,
      correctCount: 9
    });
  });

  it('正解数と問題数のラベルが逆順でも抽出する', () => {
    expect(extractStudyResult('正解数: 9 問題数: 12')).toEqual({
      totalQuestions: 12,
      correctCount: 9
    });
  });

  it('正解数が問題数を超える場合は抽出しない', () => {
    expect(extractStudyResult('10問中12問正解')).toEqual({});
  });

  it('抽出できない文字列では空を返す', () => {
    expect(extractStudyResult('今日はネットワークを復習した')).toEqual({});
  });
});
