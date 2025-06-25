import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にサインインページにアクセス
    await page.goto('/');
  });

  test('should redirect to sign-in page when not authenticated', async ({ page }) => {
    // 未認証の場合、サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // サインインページの要素が表示されることを確認
    await expect(page.getByText('Gantt Chart App')).toBeVisible();
    await expect(page.getByText('Googleでログイン')).toBeVisible();
    await expect(page.getByText('プロジェクト管理を始めるためにログインしてください')).toBeVisible();
  });

  test('should display sign-in page elements correctly', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // ページタイトルの確認
    await expect(page.getByRole('heading', { name: 'Gantt Chart App' })).toBeVisible();
    
    // Googleログインボタンの確認
    const googleButton = page.locator('button').filter({ hasText: 'Google' });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // GoogleアイコンSVGが存在することを確認
    await expect(page.locator('svg').first()).toBeVisible();
    
    // 利用規約とプライバシーポリシーリンクの確認
    await expect(page.getByText('利用規約')).toBeVisible();
    await expect(page.getByText('プライバシーポリシー')).toBeVisible();
  });

  test('should handle sign-in button interaction', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Googleログインボタンをより柔軟なセレクタで取得
    const googleButton = page.locator('button').filter({ hasText: 'Google' });
    
    // ボタンが表示されることを確認
    await expect(googleButton).toBeVisible({ timeout: 10000 });
    await expect(googleButton).toBeEnabled();
    
    // 注意: 実際のOAuth認証はテスト環境では行わない
    // ボタンの存在と有効性のみを確認
  });

  test('should display error page correctly', async ({ page }) => {
    // エラーページに直接アクセス
    await page.goto('/auth/error?error=Default', { waitUntil: 'networkidle' });
    
    // エラーページの要素確認
    await expect(page.getByText('ログインエラー')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('予期しないエラーが発生しました。')).toBeVisible();
    await expect(page.getByText('再度ログインを試す')).toBeVisible();
    await expect(page.getByText('ホームページに戻る')).toBeVisible();
    
    // エラーアイコンの確認
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('should handle different error types', async ({ page }) => {
    // Configuration エラー
    await page.goto('/auth/error?error=Configuration', { waitUntil: 'networkidle' });
    await expect(page.getByText('設定エラー')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('OAuth設定が正しく構成されていません。')).toBeVisible();
    
    // AccessDenied エラー  
    await page.goto('/auth/error?error=AccessDenied', { waitUntil: 'networkidle' });
    await expect(page.getByText('アクセス拒否')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('アカウントにアクセス権限がないか、ログインをキャンセルされました。')).toBeVisible();
  });

  test('should navigate between error page and sign-in page', async ({ page }) => {
    await page.goto('/auth/error?error=Default', { waitUntil: 'networkidle' });
    
    // エラーページが表示されるのを待つ
    await expect(page.getByText('ログインエラー')).toBeVisible({ timeout: 10000 });
    
    // 「再度ログインを試す」ボタンをクリック
    await page.getByText('再度ログインを試す').click();
    
    // サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByText('Googleでログイン')).toBeVisible();
  });
});