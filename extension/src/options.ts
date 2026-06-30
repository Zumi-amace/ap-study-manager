import { ANTHROPIC_API_KEY_STORAGE_KEY } from './config';

const form = document.querySelector<HTMLFormElement>('#api-key-form');
const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key-input');
const message = document.querySelector<HTMLParagraphElement>('#message');

async function loadSavedApiKey(): Promise<void> {
  if (!apiKeyInput) return;
  const result = await chrome.storage.local.get(ANTHROPIC_API_KEY_STORAGE_KEY);
  const saved = result[ANTHROPIC_API_KEY_STORAGE_KEY];
  if (typeof saved === 'string') apiKeyInput.value = saved;
}

async function saveApiKey(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!apiKeyInput || !message) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showMessage('APIキーを入力してください。', 'error');
    return;
  }

  await chrome.storage.local.set({
    [ANTHROPIC_API_KEY_STORAGE_KEY]: apiKey
  });
  showMessage('APIキーを保存しました。', 'success');
}

function showMessage(text: string, type: 'success' | 'error'): void {
  if (!message) return;
  message.textContent = text;
  message.className = type;
}

form?.addEventListener('submit', (event) => {
  void saveApiKey(event);
});

void loadSavedApiKey();
