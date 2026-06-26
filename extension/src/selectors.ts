import type { ExtractedProblem } from './types';

export const SELECTOR_ERROR_MESSAGE =
  '問題文を取得できませんでした。過去問道場のページ構造が変わった可能性があります。';

// フェーズ2で実DOMに合わせて調整する。セレクタは必ずこのファイルへ集約する。
export const AP_SIKEN_SELECTORS = {
  problemCandidates: ['#mondai', '.mondai', '[class*="question"]', 'main'],
  choiceCandidates: ['.selectList li', '.choices li', 'label', 'li']
} as const;

export function extractProblemFromDocument(documentRef: Document): ExtractedProblem {
  const problemText = findFirstText(documentRef, AP_SIKEN_SELECTORS.problemCandidates);
  const choices = findChoiceTexts(documentRef);

  if (!problemText || choices.length === 0) {
    throw new Error(SELECTOR_ERROR_MESSAGE);
  }

  return {
    text: problemText,
    choices
  };
}

function findFirstText(documentRef: Document, selectors: readonly string[]): string {
  for (const selector of selectors) {
    const element = documentRef.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text) return text;
  }
  return '';
}

function findChoiceTexts(documentRef: Document): string[] {
  const choices = new Set<string>();

  for (const selector of AP_SIKEN_SELECTORS.choiceCandidates) {
    documentRef.querySelectorAll(selector).forEach((element) => {
      const text = element.textContent?.trim();
      if (text && text.length >= 2 && text.length <= 300) choices.add(text);
    });
    if (choices.size >= 2) break;
  }

  return [...choices].slice(0, 8);
}
