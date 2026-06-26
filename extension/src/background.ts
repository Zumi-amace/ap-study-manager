import { buildMockHint } from './prompt';
import type { HintRequestMessage, HintResponseMessage } from './types';

chrome.runtime.onMessage.addListener(
  (
    message: HintRequestMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: HintResponseMessage) => void
  ) => {
    if (message?.type !== 'AP_STUDY_HINT_REQUEST') return false;

    // フェーズ1ではAnthropic APIへ送信せず、content scriptとの往復確認用にモックを返す。
    // フェーズ3でchrome.storage.localからAPIキーを取得し、段階的ヒント生成へ置き換える。
    sendResponse({
      ok: true,
      hint: buildMockHint(message.problemText, message.level)
    });
    return true;
  }
);
