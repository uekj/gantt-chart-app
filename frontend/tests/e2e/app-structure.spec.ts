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
    const bodyStyles = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        fontFamily: style.fontFamily,
        margin: style.margin,
        padding: style.padding
      };
    });
    
    // 基本的なCSSプロパティが適用されていることを確認
    expect(bodyStyles.display).toBeTruthy();
    expect(bodyStyles.fontFamily).toBeTruthy();
    expect(bodyStyles.margin).toBeDefined();
    expect(bodyStyles.padding).toBeDefined();
    
    // Tailwind CSSの特定のクラスが適用されているかを確認
    const googleButton = page.getByRole('button', { name: 'Googleでログイン' });
    const buttonStyles = await googleButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderRadius: style.borderRadius,
        padding: style.padding,
        backgroundColor: style.backgroundColor
      };
    });
    
    // ボタンスタイルが適用されていることを確認
    expect(buttonStyles.borderRadius).not.toBe('0px'); // rounded-md class
    expect(buttonStyles.padding).not.toBe('0px'); // px-4 py-3 classes
    expect(buttonStyles.backgroundColor).toBeTruthy(); // bg-white class
    
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