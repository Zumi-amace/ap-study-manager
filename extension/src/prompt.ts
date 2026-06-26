import type { HintLevel } from './types';

export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: 'Level 1: 着眼点だけ',
  2: 'Level 2: 選択肢の絞り込み',
  3: 'Level 3: 理由つき解説'
};

export function buildHintPrompt(problemText: string, level: HintLevel): string {
  return `あなたは応用情報技術者試験 午前対策の学習コーチです。
最初から答えだけを出さず、指定レベルのヒントを出してください。

${HINT_LEVEL_LABELS[level]}

問題文と選択肢:
${problemText}

制約:
- カンニング装置ではなく学習支援にする
- Level 1では答えを明かさない
- Level 2では選択肢を絞る観点を示す
- Level 3では理由つきで理解を助ける`;
}

export function buildMockHint(problemText: string, level: HintLevel): string {
  const preview = problemText.trim().slice(0, 80) || '現在の問題';
  return `${HINT_LEVEL_LABELS[level]}

これはフェーズ1のモックヒントです。
まず「問われている用語・計算・判断基準」を分けて確認してみてください。

対象プレビュー:
${preview}`;
}
