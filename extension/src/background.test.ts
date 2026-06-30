import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HintRequestMessage } from './types';

const SECRET_LIKE_VALUE = 'dummy-secret-never-display';

function installChromeMock(apiKey = '') {
  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: {
        addListener: vi.fn()
      }
    },
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: apiKey })),
        set: vi.fn()
      }
    }
  });
}

async function importBackground() {
  vi.resetModules();
  return import('./background');
}

const message: HintRequestMessage = {
  type: 'AP_STUDY_HINT_REQUEST',
  problemText: '問題文:\nテスト問題\n\n選択肢:\nア A\nイ B',
  level: 1
};

describe('background hint generation', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('APIキー未設定時にAPIを呼ばない', async () => {
    installChromeMock('');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { createHintResponse } = await importBackground();

    const response = await createHintResponse(message);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.ok).toBe(false);
    expect(response.error).toContain('Anthropic APIキーが未設定');
  });

  it('Anthropic APIへ問題文とLevelに応じたプロンプトを送る', async () => {
    installChromeMock(SECRET_LIKE_VALUE);
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'まず第3層の役割に注目しましょう。' }]
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const { createHintResponse } = await importBackground();

    const response = await createHintResponse({ ...message, level: 2 });
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init.body));

    expect(response.ok).toBe(true);
    expect(response.hint).toContain('第3層');
    expect(body.messages[0].content[0].text).toContain('Level 2では選択肢を絞る観点');
    expect(body.messages[0].content[0].text).toContain(message.problemText);
  });

  it('401系エラーではAPIキー不正の案内を返し、秘密値を含めない', async () => {
    installChromeMock(SECRET_LIKE_VALUE);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    const { createHintResponse } = await importBackground();

    const response = await createHintResponse(message);

    expect(response.ok).toBe(false);
    expect(response.error).toContain('APIキーが正しくない可能性');
    expect(response.error).not.toContain(SECRET_LIKE_VALUE);
  });

  it('429系エラーではレート制限の案内を返す', async () => {
    installChromeMock(SECRET_LIKE_VALUE);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    const { createHintResponse } = await importBackground();

    const response = await createHintResponse(message);

    expect(response.ok).toBe(false);
    expect(response.error).toContain('リクエスト制限');
  });

  it('ネットワークエラーではユーザー向けメッセージを返し、秘密値を含めない', async () => {
    installChromeMock(SECRET_LIKE_VALUE);
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error(`network failed: ${SECRET_LIKE_VALUE}`);
    }));
    const { createHintResponse } = await importBackground();

    const response = await createHintResponse(message);

    expect(response.ok).toBe(false);
    expect(response.error).toContain('ネットワークエラー');
    expect(response.error).not.toContain(SECRET_LIKE_VALUE);
  });
});
