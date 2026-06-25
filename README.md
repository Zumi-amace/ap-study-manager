# AP Study Manager

応用情報技術者試験 午前対策の学習管理PWAです。

問題演習は外部サイト「過去問道場」で行い、本アプリは手入力の学習ログ、復習予定、弱点分析、ダッシュボードを端末内のIndexedDBに保存します。外部サイトの問題・解説データは取得・保存しません。

## ユーザーとデータ保存の方針

本アプリは、端末内で完結するローカルファーストのシングルユーザーPWAです。

- 現在の利用者は `user_id = 1` に固定しています。
- `user_id` 列と `users` テーブルは、将来クラウド同期や複数ユーザー対応を追加できるように残しています。
- 現時点ではログイン、ユーザー切り替え、端末間同期は提供しません。
- 学習データはブラウザのIndexedDBへ保存されるため、別の端末やブラウザとは共有されません。

## 開発

```sh
pnpm install
pnpm dev
```

## ビルド・テスト

```sh
pnpm test
pnpm build
```

## GitHub Pages

`main` ブランチへpushすると、GitHub Actionsが自動的にPWAをビルドしてGitHub Pagesへ公開します。

公開URL:

`https://zumi-amace.github.io/ap-study-manager/`
