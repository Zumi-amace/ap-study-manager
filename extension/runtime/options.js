(() => {
  // extension/src/config.ts
  var ANTHROPIC_API_KEY_STORAGE_KEY = "anthropicApiKey";

  // extension/src/options.ts
  var form = document.querySelector("#api-key-form");
  var apiKeyInput = document.querySelector("#api-key-input");
  var message = document.querySelector("#message");
  async function loadSavedApiKey() {
    if (!apiKeyInput) return;
    const result = await chrome.storage.local.get(ANTHROPIC_API_KEY_STORAGE_KEY);
    const saved = result[ANTHROPIC_API_KEY_STORAGE_KEY];
    if (typeof saved === "string") apiKeyInput.value = saved;
  }
  async function saveApiKey(event) {
    event.preventDefault();
    if (!apiKeyInput || !message) return;
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showMessage("APIキーを入力してください。", "error");
      return;
    }
    await chrome.storage.local.set({
      [ANTHROPIC_API_KEY_STORAGE_KEY]: apiKey
    });
    showMessage("APIキーを保存しました。", "success");
  }
  function showMessage(text, type) {
    if (!message) return;
    message.textContent = text;
    message.className = type;
  }
  form?.addEventListener("submit", (event) => {
    void saveApiKey(event);
  });
  void loadSavedApiKey();
})();
