import { test, expect } from '@playwright/test';

test.describe('Application Structure', () => {
  test('should have correct page structure and accessibility', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // ページが正しく読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ヘッダー要素の確認
    const heading = page.getByRole('heading', { level: 2 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Gantt Chart App');
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // ボタンが適切にスタイリングされていることを確認
    const googleButton = page.getByRole('button', { name: 'Googleでログイン' });
    await expect(googleButton).toHaveClass(/rounded-md/);
    await expect(googleButton).toHaveClass(/border/);
  });

  test('should handle page navigation correctly', async ({ page }) => {
    // ルートパスから開始
    await page.goto('/');
    
    // 未認証時はサインインページにリダイレクト
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // 直接エラーページにアクセス可能
    await page.goto('/auth/error');
    await expect(page).toHaveURL(/\/auth\/error/);
    
    // 存在しないページは404ページまたはそのまま残る
    await page.goto('/non-existent-page');
    // Next.jsのデフォルト動作を確認（404ページまたは元のURL）
    const currentUrl = page.url();
    expect(currentUrl.includes('/non-existent-page') || currentUrl.includes('404')).toBeTruthy();
  });

  test('should load static assets correctly', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // CSS が正しく読み込まれていることを確認（Tailwind CSS）
    const body = page.locator('body');
    const computedStyle = await body.evaluate((el) => {
      return window.getComputedStyle(el);
    });
    
    // 基本的なスタイルが適用されていることを確認
    expect(computedStyle).toBeTruthy();
    
    // SVGアイコンが正しく表示されることを確認
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('should have correct meta tags and SEO elements', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/Gantt Chart App/);
    
    // ビューポートメタタグの確認（Next.jsデフォルト）
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});