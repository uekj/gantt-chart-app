# 認証システムセットアップガイド

## 概要

このプロジェクトはNextAuth.jsを使用してGoogle OAuthとGitHub OAuthでの認証を提供します。

## セットアップ手順

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定します：

```bash
# NextAuth.js設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000
NEXTAUTH_SECRET=your-32-character-secret-key-here

# Google OAuth設定
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database設定
DATABASE_URL=file:./local.db
```

### 2. NEXTAUTH_SECRETの生成

以下のコマンドでランダムなシークレットキーを生成：

```bash
openssl rand -base64 32
```

### 3. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. APIs & Services > Credentials に移動
4. "Create Credentials" > "OAuth 2.0 Client ID" を選択
5. アプリケーション タイプで "Web application" を選択
6. 承認済みのリダイレクトURIに以下を追加：
   - 開発環境: `http://localhost:3000/api/auth/callback/google`
   - 本番環境: `https://your-domain.com/api/auth/callback/google`

### 4. GitHub OAuth設定

1. [GitHub Developer Settings](https://github.com/settings/developers)にアクセス
2. "New OAuth App" をクリック
3. 以下の情報を入力：
   - Application name: `Gantt Chart App`
   - Homepage URL: `http://localhost:3000` (開発) / `https://your-domain.com` (本番)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github` (開発) / `https://your-domain.com/api/auth/callback/github` (本番)

### 5. データベース設定

NextAuth.jsはDrizzle ORMを使用してセッション情報をデータベースに保存します。

必要なテーブル：
- `user` - ユーザー情報
- `account` - OAuthアカウント情報
- `session` - セッション情報
- `verificationToken` - 認証トークン

これらは`lib/db/schema.ts`で定義されています。

## 本番環境での注意事項

### セキュリティ
- `NEXTAUTH_SECRET`は必ず32文字以上のランダムな文字列を使用
- OAuthアプリケーションの設定で本番ドメインのみを許可
- HTTPSを必須設定

### 環境変数
- Vercelの場合、Environment Variablesでプロダクション用の値を設定
- `NEXTAUTH_URL`は本番ドメインに変更

## トラブルシューティング

### よくあるエラー

1. **Configuration Error**
   - `NEXTAUTH_SECRET`が設定されていない
   - OAuth Client IDまたはSecretが間違っている

2. **AccessDenied**
   - OAuthアプリケーションの設定でリダイレクトURIが正しく設定されていない
   - アプリケーションが公開されていない（Google）

3. **Callback Error**
   - ドメインの設定が間違っている
   - HTTPSが必要な環境でHTTPを使用している

### デバッグ方法

開発環境では以下の環境変数でデバッグログを有効化：

```bash
NEXTAUTH_DEBUG=true
```

## 機能

- **複数プロバイダー対応**: GoogleとGitHubでの認証
- **データベースセッション**: セッション情報をDBで管理
- **エラーハンドリング**: 詳細なエラーページとメッセージ
- **セキュリティ**: CSRF対策、セッション管理