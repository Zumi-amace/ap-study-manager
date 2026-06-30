import { extractProblemFromDocument } from './selectors';
import type { HintLevel, HintRequestMessage, HintResponseMessage } from './types';

const ROOT_ID = 'ap-study-manager-hint-assist-root';

function mountHintButton(): void {
  if (document.getElementById(ROOT_ID)) return;

  const host = document.createElement('div');
  host.id = ROOT_ID;
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      color-scheme: light;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .button {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      border: 0;
      border-radius: 999px;
      background: #0f766e;
      color: #fff;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
      cursor: pointer;
      font-size: 15px;
      font-weight: 700;
      min-height: 48px;
      padding: 12px 18px;
    }
    .overlay {
      position: fixed;
      inset: auto 16px 76px auto;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 32px));
      border: 1px solid #ccfbf1;
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.24);
      color: #0f172a;
      overflow: hidden;
    }
    .header {
      align-items: center;
      background: #f0fdfa;
      display: flex;
      gap: 8px;
      justify-content: space-between;
      padding: 12px 14px;
    }
    .title {
      font-size: 14px;
      font-weight: 800;
    }
    .close {
      border: 0;
      background: transparent;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .body {
      font-size: 13px;
      line-height: 1.7;
      padding: 14px;
      white-space: pre-wrap;
    }
    .notice {
      border-radius: 12px;
      background: #fffbeb;
      color: #92400e;
      font-size: 12px;
      line-height: 1.6;
      margin-bottom: 10px;
      padding: 10px;
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .action {
      border: 1px solid #99f6e4;
      border-radius: 10px;
      background: #f0fdfa;
      color: #115e59;
      cursor: pointer;
      font-size: 13px;
      font-weight: 800;
      min-height: 38px;
      padding: 8px 10px;
    }
  `;

  const button = document.createElement('button');
  button.className = 'button';
  button.type = 'button';
  button.textContent = 'ヒント';
  button.addEventListener('click', () => requestHint(shadow, 1));

  shadow.append(style, button);
}

async function requestHint(
  shadow: ShadowRoot,
  level: HintLevel,
  existingProblemText?: string
): Promise<void> {
  let problemText = '';
  try {
    problemText = existingProblemText ?? extractProblemFromDocument(document);
  } catch (error) {
    renderOverlay(
      shadow,
      error instanceof Error ? error.message : '問題文を取得できませんでした。',
      { showNotice: false }
    );
    return;
  }

  renderOverlay(
    shadow,
    `${levelLabel(level)}を生成中です...\n\n取得した問題文・選択肢だけをbackgroundへ送ります。`
  );

  const message: HintRequestMessage = {
    type: 'AP_STUDY_HINT_REQUEST',
    problemText,
    level: 1
  };

  try {
    const response = await chrome.runtime.sendMessage(message) as HintResponseMessage;
    if (!response.ok) {
      renderOverlay(shadow, response.error ?? 'ヒント取得に失敗しました。');
      return;
    }
    renderHintOverlay(
      shadow,
      response.hint ?? 'ヒントを取得できませんでした。',
      response.level ?? level,
      problemText
    );
  } catch (error) {
    renderOverlay(shadow, error instanceof Error ? error.message : 'backgroundとの通信に失敗しました。');
  }
}

function renderOverlay(
  shadow: ShadowRoot,
  text: string,
  options: { showNotice?: boolean } = {}
): void {
  shadow.querySelector('.overlay')?.remove();
  const showNotice = options.showNotice ?? true;

  const overlay = document.createElement('section');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="header">
      <div class="title">AP Study ヒント</div>
      <button class="close" type="button" aria-label="閉じる">×</button>
    </div>
    <div class="body">
      ${showNotice ? '<div class="notice">この問題文をAIに送信します。送信対象は問題文・選択肢のみです。</div>' : ''}
      <div class="hint"></div>
    </div>
  `;

  const hint = overlay.querySelector('.hint');
  if (hint) hint.textContent = text;
  overlay.querySelector('.close')?.addEventListener('click', () => overlay.remove());
  shadow.appendChild(overlay);
}

function renderHintOverlay(
  shadow: ShadowRoot,
  text: string,
  level: HintLevel,
  problemText: string
): void {
  renderOverlay(shadow, `${levelLabel(level)}\n\n${text}`);
  const overlay = shadow.querySelector('.overlay');
  const body = overlay?.querySelector('.body');
  if (!body || level >= 3) return;

  const actions = document.createElement('div');
  actions.className = 'actions';
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'action';
  nextButton.textContent = level === 1 ? 'もう少しヒント' : '理由つき解説を見る';
  nextButton.addEventListener('click', () => {
    nextButton.disabled = true;
    void requestHint(shadow, (level + 1) as HintLevel, problemText);
  });
  actions.appendChild(nextButton);
  body.appendChild(actions);
}

function levelLabel(level: HintLevel): string {
  if (level === 1) return 'Level 1: 着眼点だけ';
  if (level === 2) return 'Level 2: 選択肢の絞り込み';
  return 'Level 3: 理由つき解説';
}

mountHintButton();
