export interface ExtractedStudyResult {
  totalQuestions?: number;
  correctCount?: number;
}

export interface AiAssistResult extends ExtractedStudyResult {
  explanation: string;
}

interface GenerateAiAssistInput {
  pastedText: string;
  apiKey: string;
}

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const DEFAULT_AI_MODEL = 'claude-3-5-haiku-20241022';

export function extractStudyResult(text: string): ExtractedStudyResult {
  const normalized = text
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, ' ')
    .trim();

  const patterns: Array<{ regex: RegExp; totalIndex: 1 | 2; correctIndex: 1 | 2 }> = [
    {
      regex: /(\d{1,3})\s*問\s*中\s*(\d{1,3})\s*問?\s*(?:正解|正答)/,
      totalIndex: 1,
      correctIndex: 2
    },
    {
      regex: /(?:正解|正答)\s*(\d{1,3})\s*問?\s*[/／]\s*(?:全)?\s*(\d{1,3})\s*問?/,
      totalIndex: 2,
      correctIndex: 1
    },
    {
      regex: /(\d{1,3})\s*[/／]\s*(\d{1,3})\s*(?:問)?\s*(?:正解|正答)?/,
      totalIndex: 2,
      correctIndex: 1
    },
    {
      regex: /(?:問題数|出題数|全問題)\D{0,8}(\d{1,3}).{0,24}(?:正解数|正答数|正解|正答)\D{0,8}(\d{1,3})/,
      totalIndex: 1,
      correctIndex: 2
    },
    {
      regex: /(?:正解数|正答数|正解|正答)\D{0,8}(\d{1,3}).{0,24}(?:問題数|出題数|全問題)\D{0,8}(\d{1,3})/,
      totalIndex: 2,
      correctIndex: 1
    }
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (!match) continue;

    const totalQuestions = Number(match[pattern.totalIndex]);
    const correctCount = Number(match[pattern.correctIndex]);
    if (!Number.isFinite(totalQuestions) || !Number.isFinite(correctCount)) continue;

    if (isReasonableResult(totalQuestions, correctCount)) {
      return { totalQuestions, correctCount };
    }
  }

  return {};
}

export async function generateAiAssist({
  pastedText,
  apiKey
}: GenerateAiAssistInput): Promise<AiAssistResult> {
  const extracted = extractStudyResult(pastedText);
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('AI解説を生成するには、設定画面でAnthropic APIキーを保存してください。');
  }

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': trimmedKey,
      'anthropic-version': '2023-06-01',
      // ブラウザだけで完結するPWAのため、ユーザー自身のキーで直接APIを呼び出す。
      // キーは端末内IndexedDBに保存し、サーバーやGitHubには送らない。
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: DEFAULT_AI_MODEL,
      max_tokens: 700,
      temperature: 0.2,
      system:
        'あなたは応用情報技術者試験 午前対策の学習コーチです。ユーザーが貼り付けた採点結果や問題文メモだけを根拠に、日本語で簡潔に復習支援をしてください。',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `以下はユーザーが過去問演習後に貼り付けたテキストです。\n\n${pastedText}\n\n次の形式で出力してください。\n- 要点まとめ: 2〜3行\n- 復習ヒント: 3点以内\n- 次にやること: 1〜2点\n\n問題データを外部取得したり、本文にない事実を断定したりしないでください。`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI解説の生成に失敗しました。（HTTP ${response.status}）`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const explanation =
    data.content
      ?.map((block) => (block.type === 'text' ? block.text ?? '' : ''))
      .join('\n')
      .trim() ?? '';

  return {
    ...extracted,
    explanation: explanation || 'AI解説を取得できませんでした。貼り付け内容を確認してください。'
  };
}

function isReasonableResult(totalQuestions: number, correctCount: number): boolean {
  return (
    Number.isInteger(totalQuestions) &&
    Number.isInteger(correctCount) &&
    totalQuestions > 0 &&
    totalQuestions <= 100 &&
    correctCount >= 0 &&
    correctCount <= totalQuestions
  );
}
