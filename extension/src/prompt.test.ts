import { describe, expect, it } from 'vitest';
import { buildHintPrompt } from './prompt';

const problemText = `問題文:
OSI参照モデルの第3層に関する説明はどれか。

選択肢:
ア 物理信号を扱う
イ 経路制御を扱う
ウ 暗号化だけを扱う
エ アプリケーション表示を扱う`;

describe('buildHintPrompt', () => {
  it('Level 1では答えを明かさない制約を含む', () => {
    const prompt = buildHintPrompt(problemText, 1);
    expect(prompt).toContain('Level 1では着眼点だけ');
    expect(prompt).toContain('正解の選択肢名や答えそのものは明かさない');
  });

  it('Level 2では絞り込み制約を含む', () => {
    const prompt = buildHintPrompt(problemText, 2);
    expect(prompt).toContain('Level 2では選択肢を絞る観点');
    expect(prompt).toContain('正解を断定しない');
  });

  it('Level 3では理由つき解説の制約を含む', () => {
    const prompt = buildHintPrompt(problemText, 3);
    expect(prompt).toContain('Level 3では正解に近い解説');
    expect(prompt).toContain('理由を説明');
    expect(prompt).toContain('答えだけの出力にしない');
  });
});
