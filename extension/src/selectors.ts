import type { ExtractedProblem } from './types';

export const SELECTOR_ERROR_MESSAGE =
  '問題文を取得できませんでした。過去問道場のページ構造が変わった可能性があります。';

const CHOICE_LABELS = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ'];

export const AP_SIKEN_SELECTORS = {
  problemCandidates: ['#mondai'],
  choiceContainers: ['#qPage .selectList', '.main.kako .ansbg > ul.selectList', '#mondai ~ .ansbg .selectList'],
  choiceItems: ['li'],
  choiceTextInsideItem: ['span[id^="select_"]', '.choiceText', '.answerText']
} as const;

export function extractProblemFromDocument(documentRef: Document): string {
  const problemText = findProblemText(documentRef);
  const choices = findChoiceTexts(documentRef);

  if (!problemText || choices.length === 0) throw new Error(SELECTOR_ERROR_MESSAGE);

  return formatProblemText({ text: problemText, choices });
}

export function extractProblemPartsFromDocument(documentRef: Document): ExtractedProblem {
  const problemText = findProblemText(documentRef);
  const choices = findChoiceTexts(documentRef);

  if (!problemText || choices.length === 0) throw new Error(SELECTOR_ERROR_MESSAGE);

  return { text: problemText, choices };
}

export function formatProblemText(problem: ExtractedProblem): string {
  const choices = problem.choices
    .map((choice, index) => `${CHOICE_LABELS[index] ?? `${index + 1}.`} ${choice}`)
    .join('\n');
  return `問題文:\n${normalizeText(problem.text)}\n\n選択肢:\n${choices}`;
}

function findChoiceTexts(documentRef: Document): string[] {
  for (const containerSelector of AP_SIKEN_SELECTORS.choiceContainers) {
    const container = documentRef.querySelector(containerSelector);
    if (!container) continue;

    const choices = [...container.querySelectorAll(AP_SIKEN_SELECTORS.choiceItems.join(','))]
      .map((item) => normalizeText(extractChoiceItemText(item)))
      .filter(isChoiceText);

    // 選択肢は順番と個数が重要。同じ文言の選択肢があり得るため重複除去しない。
    if (choices.length >= 2) return choices.slice(0, 6);
  }

  return [];
}

function findProblemText(documentRef: Document): string {
  for (const selector of AP_SIKEN_SELECTORS.problemCandidates) {
    const element = documentRef.querySelector(selector);
    const text = normalizeText(element?.textContent ?? '');
    if (text) return text;
  }
  return '';
}

function extractChoiceItemText(item: Element): string {
  for (const selector of AP_SIKEN_SELECTORS.choiceTextInsideItem) {
    const element = item.querySelector(selector);
    const text = element?.textContent;
    if (text) return text;
  }
  return item.textContent ?? '';
}

export function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/[ \t\r\n]+/g, ' ')
    .trim();
}

function isChoiceText(text: string): boolean {
  return text.length >= 1 && text.length <= 500;
}
