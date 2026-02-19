# HOSHIGAMI 開発環境セットアップ

## 初回セットアップ

### 1. 依存関係のインストール

プロジェクトルートで以下のコマンドを実行：

```bash
npm run install:all
```

これにより、以下が実行されます：
- ルートの依存関係をインストール
- フロントエンドの依存関係をインストール
- バックエンドの依存関係をインストール

### 2. 環境変数の設定

#### フロントエンド (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

#### バックエンド (`backend/.env`)
```env
PORT=5001
DATABASE_URL=postgresql://username:password@localhost:5432/hoshigami
SESSION_SECRET=your-secret-key
ADMIN_ID=2008
ADMIN_PASS=2008
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## 開発環境の起動

### 一括起動（推奨）

プロジェクトルートで以下のコマンドを実行：

```bash
npm run dev
```

これにより、以下が同時に実行されます：
- バックエンド: TypeScriptのビルド → 開発サーバー起動 (http://localhost:5001)
- フロントエンド: 開発サーバー起動 (http://localhost:3000)

### 個別起動

#### フロントエンドのみ
```bash
npm run dev:frontend
```

#### バックエンドのみ
```bash
npm run dev:backend
```

## ビルド

### バックエンドのみビルド
```bash
npm run build:backend
```

### フロントエンドのみビルド
```bash
npm run build:frontend
```

### 両方をビルド
```bash
npm run build:all
```

## 本番環境での起動

### バックエンド
```bash
cd backend
npm run build
npm start
```

### フロントエンド
```bash
cd frontend
npm run build
npm start
```

## 便利なコマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run dev` | フロントエンドとバックエンドを同時に起動 |
| `npm run dev:frontend` | フロントエンドのみ起動 |
| `npm run dev:backend` | バックエンドのみ起動（ビルド込み） |
| `npm run build` | バックエンドをビルド |
| `npm run build:backend` | バックエンドをビルド |
| `npm run build:frontend` | フロントエンドをビルド |
| `npm run build:all` | フロントエンドとバックエンドを両方ビルド |
| `npm run install:all` | 全ディレクトリの依存関係をインストール |

## トラブルシューティング

### ポートが既に使用されている場合

- フロントエンド: デフォルトは3000番ポート
- バックエンド: デフォルトは5001番ポート

他のプロセスが使用している場合は、プロセスを終了するか、ポート番号を変更してください。

### 依存関係のエラー

各ディレクトリで個別にインストールしてください：
```bash
cd frontend && npm install
cd ../backend && npm install
```
