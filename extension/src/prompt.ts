import type { HintLevel } from './types';

export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: 'Level 1: 着眼点だけ',
  2: 'Level 2: 選択肢の絞り込み',
  3: 'Level 3: 理由つき解説'
};

export function buildHintPrompt(problemText: string, level: HintLevel): string {
  const levelInstruction = getLevelInstruction(level);
  return `あなたは応用情報技術者試験 午前対策の学習コーチです。
目的は学習支援です。カンニング装置化を避け、最初から答えだけを出さないでください。

${HINT_LEVEL_LABELS[level]}

${levelInstruction}

問題文と選択肢:
${problemText}

制約:
- 出力は日本語
- 180字以内
- 問題文と選択肢に含まれる情報だけを使う
- 必要以上に長くしない`;
}

function getLevelInstruction(level: HintLevel): string {
  if (level === 1) {
    return [
      'Level 1では着眼点だけを示してください。',
      '正解の選択肢名や答えそのものは明かさないでください。',
      '選択肢の直接除外もしすぎないでください。'
    ].join('\n');
  }

  if (level === 2) {
    return [
      'Level 2では選択肢を絞る観点を示してください。',
      'ただし正解を断定しないでください。',
      'どの条件を確認すれば候補を減らせるかを説明してください。'
    ].join('\n');
  }

  return [
    'Level 3では正解に近い解説をしてください。',
    '理由を説明し、学習者が理解できるようにしてください。',
    'ただし必要以上に長くせず、答えだけの出力にしないでください。'
  ].join('\n');
}
