# GitHub Actions E2E テスト設定

## 概要

GitHub ActionsでPull Request作成時にE2Eテストを自動実行し、マージ前の品質チェックを行います。

## 設定済みワークフロー

### `.github/workflows/e2e-tests.yml`

- **トリガー**: PRがmainブランチに作成・更新された時（frontend配下のファイル変更時）
  - PR作成時（opened）
  - PRに新しいコミットがプッシュされた時（synchronize）
  - PRが再オープンされた時（reopened）
- **実行環境**: Ubuntu latest
- **Node.js**: 22.16.0
- **pnpm**: 9.12.0
- **テスト**: Playwrightを使用したE2Eテスト

### 主な機能

1. **依存関係のキャッシュ**: pnpmキャッシュで高速化
2. **Playwrightブラウザ自動インストール**: テスト用ブラウザを自動セットアップ
3. **テスト環境分離**: 専用の環境変数とテストDB使用
4. **結果保存**: テスト失敗時の詳細情報とレポートをアーティファクトで保存

## ブランチ保護設定（要手動設定）

GitHubのリポジトリ設定で以下を設定してください：

### 1. ブランチ保護ルールの追加

1. GitHub リポジトリの Settings > Branches に移動
2. "Add rule" をクリック
3. Branch name pattern: `main`
4. 以下の設定を有効化：
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Status checks that are required:
     - `e2e-tests` ✅

### 2. Auto-merge設定（推奨）

1. Settings > General > Pull Requests
2. ✅ Allow auto-merge
3. ✅ Automatically delete head branches

## 使用方法

### 開発者向け

1. **新機能開発**:
   ```bash
   git checkout -b feature/new-feature
   # 機能開発 + E2Eテスト追加
   git push origin feature/new-feature
   ```

2. **Pull Request作成・更新**:
   - PRを作成すると自動でE2Eテストが実行
   - PR中にコード修正をプッシュすると再度テストが実行
   - テストが全て通るまでマージ不可
   - テスト失敗時は詳細ログとスクリーンショットで確認可能

3. **マージ**:
   - E2Eテスト成功後のみマージ可能
   - Auto-merge設定時は自動マージも可能

### 手動実行

```bash
# ローカルでE2Eテスト実行
pnpm test:e2e

# GitHub Actions手動実行
# Actions タブ > E2E Tests > Run workflow
```

## トラブルシューティング

### よくある問題

1. **テスト失敗時**:
   - Actions の Summary から "test-results" アーティファクトをダウンロード
   - スクリーンショットとエラーログで問題を特定

2. **依存関係エラー**:
   - pnpm-lock.yamlの更新確認
   - キャッシュクリア: Actions で "Clear cache"

3. **タイムアウト**:
   - 30分の制限時間内で完了しない場合はワークフロー設定を調整

### パフォーマンス最適化

- **並列実行**: テストは複数ブラウザで並列実行
- **キャッシュ活用**: pnpm と Playwright のキャッシュで高速化  
- **条件実行**: frontend配下の変更時のみ実行

## 今後の拡張

- Unit/Integration テストの追加
- コードカバレッジレポート
- パフォーマンステスト
- セキュリティスキャン