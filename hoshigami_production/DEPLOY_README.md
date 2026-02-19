# HOSHIGAMI 本番環境デプロイ手順

このディレクトリ（`hoshigami_production`）は、VPSへのデプロイ用に作成されたクリーンなソースコード一式です。
`node_modules` や `.git` などの不要なファイルは含まれていません。

## 手順1: ファイルのアップロード

WinSCPなどのFTPソフトを使用して、この `hoshigami_production` フォルダの中身（`backend`, `frontend`）を VPS上の `/var/www/hoshigami/` ディレクトリに上書きアップロードしてください。

**注意:**
- サーバー上の既存の `.env` ファイルは上書きされません（安全のため、このフォルダには含めていません）。
- アップロード前に、念のためサーバー上の既存ファイルのバックアップを取ることを推奨します。

## 手順2: サーバー上での更新コマンド実行

Tera TermなどでVPSにSSH接続し、以下のコマンドを順番に実行してください。

### 1. Backendの更新

```bash
cd /var/www/hoshigami/backend

# 依存関係のインストール（新しいパッケージがある場合）
npm install --production

# ビルド実行
npm run build

# アプリケーション再起動
pm2 restart hoshigami-backend
```

### 2. Frontendの更新

```bash
cd /var/www/hoshigami/frontend

# 依存関係のインストール
npm install --production

# ビルド実行
npm run build

# アプリケーション再起動
pm2 restart hoshigami-frontend
```

## 手順3: 動作確認

ブラウザでサイトにアクセスし、変更（請求書ボタンの改善など）が反映されているか確認してください。
