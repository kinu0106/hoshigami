# SSH接続コマンド

## Xserver VPSへのSSH接続

### 基本的なSSH接続コマンド

```bash
# 形式1: rootユーザーで接続（推奨）
ssh root@your-vps-ip

# 形式2: カスタムユーザーで接続
ssh username@your-vps-ip

# 形式3: ポート番号を指定する場合（デフォルトは22）
ssh -p 22 root@your-vps-ip
```

### 実際の接続例

Xserver VPSの場合、以下の情報が必要です：

1. **IPアドレスまたはサーバー名**
   - Xserverのコントロールパネルで確認
   - 例: `123.456.789.012` または `vps-xxx.xserver.jp`

2. **ユーザー名**
   - 通常は `root` または Xserverで設定したユーザー名

3. **ポート番号**
   - デフォルトは `22`
   - カスタムポートを使用している場合はそのポート番号

### 接続コマンドの例

```bash
# 例1: IPアドレスで接続
ssh root@123.456.789.012

# 例2: サーバー名で接続
ssh root@vps-xxx.xserver.jp

# 例3: カスタムポートで接続
ssh -p 2222 root@123.456.789.012

# 例4: 秘密鍵ファイルを指定する場合
ssh -i ~/.ssh/id_rsa root@123.456.789.012
```

## 接続後の作業手順

SSH接続が成功したら、以下のコマンドを実行してください：

```bash
# 1. 本番環境のディレクトリに移動
cd /var/www/hoshigami/backend

# 2. 現在の状態を確認
pwd
ls -la

# 3. 最新のコードを取得（Gitを使用している場合）
# git pull origin main
# または、ローカルからファイルをアップロードする場合は scp を使用

# 4. 依存関係をインストール（必要に応じて）
npm install

# 5. ビルドを実行
npm run build

# 6. PM2でバックエンドを再起動
pm2 restart hoshigami-backend

# 7. ログを確認して正常に起動したか確認
pm2 logs hoshigami-backend --lines 50

# 8. PM2のプロセス一覧を確認
pm2 list
```

## ローカルからファイルをアップロードする場合

修正したファイルを本番サーバーにアップロードする場合：

```bash
# バックエンドのソースファイルをアップロード
scp -r hoshigami_production/backend/src/* root@your-vps-ip:/var/www/hoshigami/backend/src/

# または、ビルド済みのdistフォルダをアップロード
scp -r hoshigami_production/backend/dist/* root@your-vps-ip:/var/www/hoshigami/backend/dist/
```

## トラブルシューティング

### SSH接続ができない場合

1. **IPアドレスとポート番号を確認**
   ```bash
   # 接続テスト
   ping your-vps-ip
   ```

2. **ファイアウォールの設定を確認**
   - XserverのコントロールパネルでSSHポート（22）が開放されているか確認

3. **鍵認証を使用している場合**
   - 秘密鍵ファイルのパスを確認
   - 権限を確認: `chmod 600 ~/.ssh/id_rsa`

### 接続後の注意事項

- 本番環境での作業は慎重に行ってください
- 重要な変更を行う前にバックアップを取ることを推奨します
- PM2のログを定期的に確認してください

## 参考情報

- Xserver VPSのSSH接続情報は、Xserverのコントロールパネルで確認できます
- IPアドレスやサーバー名は、Xserverのコントロールパネル > サーバー情報 で確認できます

