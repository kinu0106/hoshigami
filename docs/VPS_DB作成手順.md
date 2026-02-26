# VPS データベース（DB）作成手順

新しいシステムをVPSにデプロイする前に、専用のDBを用意する必要があります。
以下の手順でPostgreSQLに新しいDBを作成してください。

---

## 事前準備

作業前に以下を決めておいてください。

| 項目 | 例 | 説明 |
|------|-----|------|
| DB名 | `hoshigami_〇〇` | システム名を入れた一意な名前 |
| ユーザー名 | `postgres` | 既存ユーザーを流用でもよい |
| パスワード | （自分で決める） | `.env` の `DB_PASSWORD` に書く値 |

> **ポート管理表（`VPS_ポート管理.md`）** と同様に、DBを作ったらこのドキュメントや関連ファイルに記録しておくこと。

---

## 手順

### 1. VPSにSSH接続する

```bash
ssh -p 58923 root@furihaba.net
```

### 2. PostgreSQLに入る

```bash
psql -U postgres -h localhost
```

パスワード（`k_pass`）を入力して `postgres=#` が表示されれば成功。

### 3. 新しいDBを作る

```sql
CREATE DATABASE hoshigami_〇〇;
```

### 4. （オプション）専用ユーザーを作る

セキュリティを高めたい場合は、システム専用のユーザーを作成する。

```sql
CREATE USER 〇〇_user WITH PASSWORD '任意のパスワード';
GRANT ALL PRIVILEGES ON DATABASE hoshigami_〇〇 TO 〇〇_user;
```

既存の `postgres` ユーザーを流用する場合は、この手順は不要。

### 5. DBが作られたか確認する

```sql
\l
```

一覧に `hoshigami_〇〇` が表示されれば完了。

### 6. PostgreSQLを抜ける

```sql
\q
```

---

## 作成後にやること

1. VPS上の `.env` に接続情報を書き込む（`003_VPS環境変数(.env)の設定.md` を参照）

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=（設定したパスワード）
DB_NAME=hoshigami_〇〇
```

2. `schema.sql` 等でテーブルを作成する（プロジェクトの初期化手順に従う）
