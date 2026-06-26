const API_KEY_STORAGE_KEY = 'anthropic_api_key';

export async function saveAnthropicApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({
    [API_KEY_STORAGE_KEY]: apiKey.trim()
  });
}

export async function getAnthropicApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(API_KEY_STORAGE_KEY);
  return typeof result[API_KEY_STORAGE_KEY] === 'string' ? result[API_KEY_STORAGE_KEY] : '';
}
