import {
  ANTHROPIC_API_KEY_STORAGE_KEY,
  ANTHROPIC_MESSAGES_URL,
  ANTHROPIC_MODEL
} from './config';
import { buildHintPrompt } from './prompt';
import type {
  AnthropicMessagesResponse,
  HintRequestMessage,
  HintResponseMessage
} from './types';

const API_KEY_MISSING_MESSAGE =
  'Anthropic APIキーが未設定です。拡張機能のオプションページでAPIキーを保存してください。';

chrome.runtime.onMessage.addListener(
  (
    message: HintRequestMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: HintResponseMessage) => void
  ) => {
    if (message?.type !== 'AP_STUDY_HINT_REQUEST') return false;

    createHintResponse(message)
      .then(sendResponse)
      .catch(() => {
        sendResponse({
          ok: false,
          error: 'AIヒントの生成に失敗しました。'
        });
      });
    return true;
  }
);

export async function createHintResponse(
  message: HintRequestMessage
): Promise<HintResponseMessage> {
  const apiKey = await getStoredAnthropicApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: API_KEY_MISSING_MESSAGE,
      level: message.level
    };
  }

  try {
    const hint = await requestAnthropicHint({
      apiKey,
      problemText: message.problemText,
      level: message.level,
      fetchImpl: fetch
    });
    return {
      ok: true,
      hint,
      level: message.level
    };
  } catch (error) {
    return {
      ok: false,
      error: toUserFacingApiError(error),
      level: message.level
    };
  }
}

export async function getStoredAnthropicApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(ANTHROPIC_API_KEY_STORAGE_KEY);
  const value = result[ANTHROPIC_API_KEY_STORAGE_KEY];
  return typeof value === 'string' ? value.trim() : '';
}

export async function requestAnthropicHint({
  apiKey,
  problemText,
  level,
  fetchImpl
}: {
  apiKey: string;
  problemText: string;
  level: HintRequestMessage['level'];
  fetchImpl: typeof fetch;
}): Promise<string> {
  const response = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Chrome拡張のservice workerから、ユーザー自身のキーで直接APIを呼び出す。
      // APIキーはchrome.storage.localにのみ保存し、エラー表示やログへは出さない。
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 500,
      temperature: 0.2,
      system:
        'あなたは応用情報技術者試験 午前対策の学習コーチです。答えを丸投げせず、段階的なヒントで理解を助けてください。',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildHintPrompt(problemText, level)
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new AnthropicApiError(response.status);
  }

  const data = (await response.json()) as AnthropicMessagesResponse;
  const hint =
    data.content
      ?.map((block) => (block.type === 'text' ? block.text ?? '' : ''))
      .join('\n')
      .trim() ?? '';

  if (!hint) throw new Error('empty_hint');
  return hint;
}

export class AnthropicApiError extends Error {
  constructor(readonly status: number) {
    super(`Anthropic API error: ${status}`);
  }
}

export function toUserFacingApiError(error: unknown): string {
  if (error instanceof AnthropicApiError) {
    if (error.status === 401 || error.status === 403) {
      return 'APIキーが正しくない可能性があります。オプションページで確認してください。';
    }
    if (error.status === 429) {
      return 'リクエスト制限に達しました。時間をおいて再試行してください。';
    }
    if (error.status >= 500) {
      return 'Anthropic API側で一時的な問題が発生しています。時間をおいて再試行してください。';
    }
    return 'AIヒントの生成に失敗しました。';
  }

  return 'ネットワークエラーが発生しました。接続を確認して再試行してください。';
}
