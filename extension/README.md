# AP Study Manager Hint Assist

AP Study Managerのリアルタイムヒント機能をChrome拡張機能として実装するためのディレクトリです。

## なぜPWAではなくChrome拡張機能なのか

PWA本体は過去問道場をiframeで表示しますが、`ap-siken.com` は別オリジンです。Same-Origin Policyにより、PWA側からiframe内のDOMを読むことはできません。

そのため、現在表示中の問題文・選択肢を読み取り、その場でヒントを出す機能はChrome拡張機能のcontent scriptで実現します。

## 実装済み

- Manifest V3
- content script対象は `https://*.ap-siken.com/*` のみに限定
- permissionsは `storage` のみに限定
- Anthropic API用host permissionは `https://api.anthropic.com/*` のみに限定
- ap-siken.com上に「ヒント」ボタンを表示
- content scriptからbackgroundへメッセージ送信
- backgroundからAnthropic APIへ接続して段階的ヒントを生成
- Shadow DOM内のオーバーレイでヒントを表示
- optionsページでAnthropic APIキーを保存
- Level 1〜3の段階的ヒントに対応

## ビルド

`extension/runtime/*.js` は生成物です。直接編集せず、`extension/src/*.ts` を編集してから以下を実行してください。

```bash
pnpm build:ext
```

manifestは引き続き `extension/runtime/content.js` と `extension/runtime/background.js` を読み込みます。

## APIキー設定

1. Chromeで `chrome://extensions` を開く
2. `AP Study Manager Hint Assist` の「詳細」を開く
3. 「拡張機能のオプション」を開く
4. Anthropic APIキーを入力して保存

APIキーは端末内の `chrome.storage.local` に保存されます。リポジトリやGitHub Pagesには保存されません。

## セキュリティとプライバシー

- PWA側からiframe内DOMは読みません。
- 送信対象は問題文・選択肢のみとします。
- APIキーは `chrome.storage.local` に保存し、リポジトリには含めません。
- 共有端末ではAPIキーを保存しないでください。
- `runtime/*.js` は生成物です。直接編集せず、変更後は `pnpm build:ext` を実行してください。

## ローカルで読み込む方法

1. Chromeで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. この `extension/` フォルダを選択
5. `https://www.ap-siken.com/` 配下のページを開く

APIキー未設定時は、ヒントボタン押下時にオプションページで保存するよう案内します。
