(() => {
  // extension/src/config.ts
  var ANTHROPIC_API_KEY_STORAGE_KEY = "anthropicApiKey";
  var ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
  var ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

  // extension/src/prompt.ts
  var HINT_LEVEL_LABELS = {
    1: "Level 1: 着眼点だけ",
    2: "Level 2: 選択肢の絞り込み",
    3: "Level 3: 理由つき解説"
  };
  function buildHintPrompt(problemText, level) {
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
  function getLevelInstruction(level) {
    if (level === 1) {
      return [
        "Level 1では着眼点だけを示してください。",
        "正解の選択肢名や答えそのものは明かさないでください。",
        "選択肢の直接除外もしすぎないでください。"
      ].join("\n");
    }
    if (level === 2) {
      return [
        "Level 2では選択肢を絞る観点を示してください。",
        "ただし正解を断定しないでください。",
        "どの条件を確認すれば候補を減らせるかを説明してください。"
      ].join("\n");
    }
    return [
      "Level 3では正解に近い解説をしてください。",
      "理由を説明し、学習者が理解できるようにしてください。",
      "ただし必要以上に長くせず、答えだけの出力にしないでください。"
    ].join("\n");
  }

  // extension/src/background.ts
  var API_KEY_MISSING_MESSAGE = "Anthropic APIキーが未設定です。拡張機能のオプションページでAPIキーを保存してください。";
  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message?.type !== "AP_STUDY_HINT_REQUEST") return false;
      createHintResponse(message).then(sendResponse).catch(() => {
        sendResponse({
          ok: false,
          error: "AIヒントの生成に失敗しました。"
        });
      });
      return true;
    }
  );
  async function createHintResponse(message) {
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
  async function getStoredAnthropicApiKey() {
    const result = await chrome.storage.local.get(ANTHROPIC_API_KEY_STORAGE_KEY);
    const value = result[ANTHROPIC_API_KEY_STORAGE_KEY];
    return typeof value === "string" ? value.trim() : "";
  }
  async function requestAnthropicHint({
    apiKey,
    problemText,
    level,
    fetchImpl
  }) {
    const response = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Chrome拡張のservice workerから、ユーザー自身のキーで直接APIを呼び出す。
        // APIキーはchrome.storage.localにのみ保存し、エラー表示やログへは出さない。
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        temperature: 0.2,
        system: "あなたは応用情報技術者試験 午前対策の学習コーチです。答えを丸投げせず、段階的なヒントで理解を助けてください。",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
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
    const data = await response.json();
    const hint = data.content?.map((block) => block.type === "text" ? block.text ?? "" : "").join("\n").trim() ?? "";
    if (!hint) throw new Error("empty_hint");
    return hint;
  }
  var AnthropicApiError = class extends Error {
    constructor(status) {
      super(`Anthropic API error: ${status}`);
      this.status = status;
    }
    status;
  };
  function toUserFacingApiError(error) {
    if (error instanceof AnthropicApiError) {
      if (error.status === 401 || error.status === 403) {
        return "APIキーが正しくない可能性があります。オプションページで確認してください。";
      }
      if (error.status === 429) {
        return "リクエスト制限に達しました。時間をおいて再試行してください。";
      }
      if (error.status >= 500) {
        return "Anthropic API側で一時的な問題が発生しています。時間をおいて再試行してください。";
      }
      return "AIヒントの生成に失敗しました。";
    }
    return "ネットワークエラーが発生しました。接続を確認して再試行してください。";
  }
})();
