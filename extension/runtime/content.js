(() => {
  // extension/src/selectors.ts
  var SELECTOR_ERROR_MESSAGE = "問題文を取得できませんでした。過去問道場のページ構造が変わった可能性があります。";
  var CHOICE_LABELS = ["ア", "イ", "ウ", "エ", "オ", "カ"];
  var AP_SIKEN_SELECTORS = {
    problemCandidates: ["#mondai", ".sentence#mondai", ".mondai", "[data-question]"],
    choiceContainers: ["#qPage .selectList", ".main.kako .ansbg > ul.selectList", "#mondai ~ .ansbg .selectList"],
    choiceItems: ["li"],
    choiceTextInsideItem: ['span[id^="select_"]', ".choiceText", ".answerText"]
  };
  function extractProblemFromDocument(documentRef) {
    const problemText = findProblemText(documentRef);
    const choices = findChoiceTexts(documentRef);
    if (!problemText || choices.length === 0) throw new Error(SELECTOR_ERROR_MESSAGE);
    return formatProblemText({ text: problemText, choices });
  }
  function formatProblemText(problem) {
    const choices = problem.choices.map((choice, index) => `${CHOICE_LABELS[index] ?? `${index + 1}.`} ${choice}`).join("\n");
    return `問題文:
${normalizeText(problem.text)}

選択肢:
${choices}`;
  }
  function findChoiceTexts(documentRef) {
    for (const containerSelector of AP_SIKEN_SELECTORS.choiceContainers) {
      const container = documentRef.querySelector(containerSelector);
      if (!container) continue;
      const choices = [...container.querySelectorAll(AP_SIKEN_SELECTORS.choiceItems.join(","))].map((item) => normalizeText(extractChoiceItemText(item))).filter(isChoiceText);
      if (choices.length >= 2) return uniqueTexts(choices).slice(0, 6);
    }
    return [];
  }
  function findProblemText(documentRef) {
    for (const selector of AP_SIKEN_SELECTORS.problemCandidates) {
      const element = documentRef.querySelector(selector);
      const text = normalizeText(element?.textContent ?? "");
      if (text) return text;
    }
    return "";
  }
  function extractChoiceItemText(item) {
    for (const selector of AP_SIKEN_SELECTORS.choiceTextInsideItem) {
      const element = item.querySelector(selector);
      const text = element?.textContent;
      if (text) return text;
    }
    return item.textContent ?? "";
  }
  function normalizeText(text) {
    return text.replace(/\u00a0/g, " ").replace(/\u3000/g, " ").replace(/[ \t\r\n]+/g, " ").trim();
  }
  function isChoiceText(text) {
    return text.length >= 1 && text.length <= 500;
  }
  function uniqueTexts(texts) {
    return [...new Set(texts)];
  }

  // extension/src/content.ts
  var ROOT_ID = "ap-study-manager-hint-assist-root";
  function mountHintButton() {
    if (document.getElementById(ROOT_ID)) return;
    const host = document.createElement("div");
    host.id = ROOT_ID;
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
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
    const button = document.createElement("button");
    button.className = "button";
    button.type = "button";
    button.textContent = "ヒント";
    button.addEventListener("click", () => requestHint(shadow));
    shadow.append(style, button);
  }
  async function requestHint(shadow) {
    let problemText = "";
    try {
      problemText = extractProblemFromDocument(document);
    } catch (error) {
      renderOverlay(
        shadow,
        error instanceof Error ? error.message : "問題文を取得できませんでした。",
        { showNotice: false }
      );
      return;
    }
    renderOverlay(
      shadow,
      "この問題文をAIに送信します。\n\nフェーズ2では、取得した問題文・選択肢だけをbackgroundへ送ります。"
    );
    const message = {
      type: "AP_STUDY_HINT_REQUEST",
      problemText,
      level: 1
    };
    try {
      const response = await chrome.runtime.sendMessage(message);
      renderOverlay(shadow, response.ok ? response.hint ?? "ヒントを取得できませんでした。" : response.error ?? "ヒント取得に失敗しました。");
    } catch (error) {
      renderOverlay(shadow, error instanceof Error ? error.message : "backgroundとの通信に失敗しました。");
    }
  }
  function renderOverlay(shadow, text, options = {}) {
    shadow.querySelector(".overlay")?.remove();
    const showNotice = options.showNotice ?? true;
    const overlay = document.createElement("section");
    overlay.className = "overlay";
    overlay.innerHTML = `
    <div class="header">
      <div class="title">AP Study ヒント</div>
      <button class="close" type="button" aria-label="閉じる">×</button>
    </div>
    <div class="body">
      ${showNotice ? '<div class="notice">この問題文をAIに送信します。送信対象は問題文・選択肢のみです。</div>' : ""}
      <div class="hint"></div>
    </div>
  `;
    const hint = overlay.querySelector(".hint");
    if (hint) hint.textContent = text;
    overlay.querySelector(".close")?.addEventListener("click", () => overlay.remove());
    shadow.appendChild(overlay);
  }
  mountHintButton();
})();
