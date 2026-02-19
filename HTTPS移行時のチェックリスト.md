# HTTPS移行時のチェックリスト

## バックエンドの設定変更

### 1. セッションクッキーの設定（`backend/src/index.ts`）

**現在の設定：**
```typescript
secure: process.env.SESSION_SECURE === 'true' || false,
```

**HTTPS移行時の変更：**
1. `.env`ファイルに以下を追加：
   ```
   SESSION_SECURE=true
   ```

2. または、`backend/src/index.ts`の`secure`を直接`true`に変更：
   ```typescript
   secure: true, // HTTPS使用時はtrue必須
   ```

3. `sameSite`の設定も確認：
   - 現在：`sameSite: 'lax'`
   - クロスドメインで動作する場合は`sameSite: 'none'`に変更が必要な場合あり
   - `sameSite: 'none'`を使用する場合は`secure: true`が必須

### 2. CORS設定の確認（`backend/src/index.ts`）

**現在の設定：**
```typescript
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true }));
```

**HTTPS移行時の変更：**
- `.env`ファイルの`CORS_ORIGIN`をHTTPSのURLに変更：
  ```
  CORS_ORIGIN=https://yourdomain.com
  ```

### 3. 環境変数の確認

以下の環境変数がHTTPSのURLになっているか確認：
- `CORS_ORIGIN`: `https://yourdomain.com`
- `SESSION_SECURE`: `true`（追加）

## フロントエンドの設定変更

### 1. 環境変数の確認（`frontend/.env.production`）

**現在の設定：**
```
NEXT_PUBLIC_API_URL=http://162.43.41.152
```

**HTTPS移行時の変更：**
```
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 2. 再ビルド

環境変数を変更した後、必ず再ビルド：
```bash
cd /var/www/hoshigami/frontend
rm -rf .next
NEXT_PUBLIC_API_URL=https://yourdomain.com npm run build
pm2 restart hoshigami-frontend
```

## Nginxの設定

### SSL証明書の設定

1. Let's EncryptなどのSSL証明書を取得
2. Nginxの設定ファイル（`/etc/nginx/sites-available/hoshigami`）を更新：
   ```nginx
   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       # HTTPからHTTPSへのリダイレクト
       # ...
   }
   
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

## 確認事項

- [ ] バックエンドの`.env`に`SESSION_SECURE=true`を追加
- [ ] バックエンドの`.env`の`CORS_ORIGIN`をHTTPSのURLに変更
- [ ] バックエンドを再起動
- [ ] フロントエンドの`.env.production`の`NEXT_PUBLIC_API_URL`をHTTPSのURLに変更
- [ ] フロントエンドを再ビルド・再起動
- [ ] NginxのSSL証明書を設定
- [ ] Nginxの設定を更新（HTTP→HTTPSリダイレクト）
- [ ] Nginxを再起動
- [ ] ブラウザでHTTPSでアクセスして動作確認
- [ ] セッションクッキーが正しく設定されているか確認（開発者ツールのアプリケーションタブ）

## 注意事項

- `secure: true`に設定すると、HTTPではセッションクッキーが送信されなくなります
- `sameSite: 'none'`を使用する場合は、必ず`secure: true`が必要です
- 環境変数を変更した後は、必ずアプリケーションを再起動してください




