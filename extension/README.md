# AP Study Manager Hint Assist

AP Study Managerのリアルタイムヒント機能をChrome拡張機能として実装するためのディレクトリです。

## なぜPWAではなくChrome拡張機能なのか

PWA本体は過去問道場をiframeで表示しますが、`ap-siken.com` は別オリジンです。Same-Origin Policyにより、PWA側からiframe内のDOMを読むことはできません。

そのため、現在表示中の問題文・選択肢を読み取り、その場でヒントを出す機能はChrome拡張機能のcontent scriptで実現します。

## フェーズ1で実装済み

- Manifest V3
- content script対象は `https://*.ap-siken.com/*` のみに限定
- permissionsは `storage` のみに限定
- Anthropic API用host permissionは `https://api.anthropic.com/*` のみに限定
- ap-siken.com上に「ヒント」ボタンを表示
- content scriptからbackgroundへメッセージ送信
- backgroundからモックヒントを返却
- Shadow DOM内のオーバーレイでヒントを表示

## ビルド

`extension/runtime/*.js` は生成物です。直接編集せず、`extension/src/*.ts` を編集してから以下を実行してください。

```bash
pnpm build:ext
```

manifestは引き続き `extension/runtime/content.js` と `extension/runtime/background.js` を読み込みます。

## 今後のフェーズ

- フェーズ2: `selectors.ts` に集約したセレクタで問題文・選択肢を取得
- フェーズ3: `chrome.storage.local` に保存したAnthropic APIキーで段階的ヒントを生成

## セキュリティとプライバシー

- PWA側からiframe内DOMは読みません。
- 送信対象は問題文・選択肢のみとします。
- APIキーは `chrome.storage.local` に保存し、リポジトリには含めません。
- 共有端末ではAPIキーを保存しないでください。

## ローカルで読み込む方法

1. Chromeで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. この `extension/` フォルダを選択
5. `https://www.ap-siken.com/` 配下のページを開く

フェーズ1ではAPI通信は行わず、モックヒントを表示します。
