# 単語テストアプリ

Next.js + WebSocket で構築した、リアルタイムランキング付きの穴埋め英単語テストアプリです。

## 機能

- **管理者**: ルームを作成し、ルームIDを参加者に共有
- **参加者**: ルームIDで入室 → ユーザー名を設定 → テスト受験
- **リアルタイムランキング**: 全員が回答を提出すると、一斉にランキングを表示
- **答え合わせ**: ランキング表示後、自分の各問題の正誤を確認

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 使い方

1. **管理者**: `/admin` でルーム名と5問の問題（問題文・正解・ヒント）を設定してルームを作成
2. **参加者**: トップページでルームIDを入力 → ユーザー名を設定
3. 設定された問題に回答して「回答を提出」
4. 全員が提出すると、同時に下位から順にランキングが発表される

## 技術スタック

- Next.js 15 (App Router)
- Tailwind CSS 4
- ShadCN UI
- WebSocket (ws)
- TypeScript

## アーキテクチャ

- HTTP + WebSocket: カスタム Node サーバー（同一ポート）
- ルーム・提出状況: インメモリ管理（再起動でリセット）

## デプロイ（最も簡単: Railway）

このアプリは **WebSocket + 常時起動サーバー** が必要なため、Vercel より **Railway** や **Render** が向いています。

### Railway（おすすめ）

1. [railway.app](https://railway.app) に GitHub リポジトリを連携
2. 「New Project」→「Deploy from GitHub repo」でこのリポジトリを選択
3. ビルド・起動コマンドは `railway.toml` が自動適用されます
   - ビルド: `npm install && npm run build`
   - 起動: `npm run start`
4. デプロイ完了後、表示された URL（例: `https://xxx.up.railway.app`）を開く

環境変数は通常 **設定不要** です（WebSocket は同じ URL に自動接続）。

### Render

1. [render.com](https://render.com) で「New +」→「Blueprint」
2. リポジトリを選び `render.yaml` を適用
3. デプロイ後、表示 URL にアクセス

### 注意

- **無料プラン** はスリープ・再起動があり、ルームデータは消えます
- 同時接続が多い場合は有料プランを検討してください
- Vercel 単体では WebSocket サーバーを動かせないため非対応です
