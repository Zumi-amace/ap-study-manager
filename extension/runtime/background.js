(() => {
  // extension/src/prompt.ts
  var HINT_LEVEL_LABELS = {
    1: "Level 1: 着眼点だけ",
    2: "Level 2: 選択肢の絞り込み",
    3: "Level 3: 理由つき解説"
  };
  function buildMockHint(problemText, level) {
    const preview = problemText.trim().slice(0, 80) || "現在の問題";
    return `${HINT_LEVEL_LABELS[level]}

これはフェーズ1のモックヒントです。
まず「問われている用語・計算・判断基準」を分けて確認してみてください。

対象プレビュー:
${preview}`;
  }

  // extension/src/background.ts
  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message?.type !== "AP_STUDY_HINT_REQUEST") return false;
      sendResponse({
        ok: true,
        hint: buildMockHint(message.problemText, message.level)
      });
      return true;
    }
  );
})();
