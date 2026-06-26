const ROOT_ID = 'ap-study-manager-hint-assist-root';

function mountHintButton() {
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
  `;

  const button = document.createElement('button');
  button.className = 'button';
  button.type = 'button';
  button.textContent = 'ヒント';
  button.addEventListener('click', () => requestHint(shadow));

  shadow.append(style, button);
}

async function requestHint(shadow) {
  renderOverlay(
    shadow,
    'この問題文をAIに送信します。\n\nフェーズ1ではAPI送信せず、backgroundとの通信確認用モックヒントを表示します。'
  );

  const message = {
    type: 'AP_STUDY_HINT_REQUEST',
    problemText: buildPhaseOneProblemText(),
    level: 1
  };

  try {
    const response = await chrome.runtime.sendMessage(message);
    renderOverlay(
      shadow,
      response.ok ? response.hint ?? 'ヒントを取得できませんでした。' : response.error ?? 'ヒント取得に失敗しました。'
    );
  } catch (error) {
    renderOverlay(shadow, error instanceof Error ? error.message : 'backgroundとの通信に失敗しました。');
  }
}

function renderOverlay(shadow, text) {
  shadow.querySelector('.overlay')?.remove();

  const overlay = document.createElement('section');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="header">
      <div class="title">AP Study ヒント</div>
      <button class="close" type="button" aria-label="閉じる">×</button>
    </div>
    <div class="body">
      <div class="notice">この問題文をAIに送信します。送信対象は問題文・選択肢のみです。</div>
      <div class="hint"></div>
    </div>
  `;

  const hint = overlay.querySelector('.hint');
  if (hint) hint.textContent = text;
  overlay.querySelector('.close')?.addEventListener('click', () => overlay.remove());
  shadow.appendChild(overlay);
}

function buildPhaseOneProblemText() {
  const title = document.title.trim();
  const path = location.pathname;
  return `フェーズ1通信確認用\nページタイトル: ${title}\nパス: ${path}`;
}

mountHintButton();
