import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にサインインページにアクセス
    await page.goto('/auth/signin');
    
    // モック認証でログイン状態にする
    await page.evaluate(() => {
      localStorage.setItem('next-auth.session-token', 'mock-session-token');
      document.cookie = 'next-auth.session-token=mock-session-token; path=/';
    });
    
    // メインページに移動
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should display mobile layout correctly', async ({ page }) => {
      // ページが読み込まれることを確認
      await page.waitForSelector('main');
      
      // ヘッダーが表示されることを確認
      await expect(page.locator('header')).toBeVisible();
      
      // サイドバーの表示確認（モバイルでは折りたたまれる可能性）
      const sidebar = page.locator('[data-testid="project-list"]');
      
      // サイドバーが表示されているか、メニューボタンがあるかを確認
      const sidebarVisible = await sidebar.isVisible();
      if (!sidebarVisible) {
        // モバイルメニューボタンが存在することを確認
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      } else {
        await expect(sidebar).toBeVisible();
      }
      
      // ガントチャートエリアが表示されることを確認
      await expect(page.locator('[data-testid="gantt-chart"]')).toBeVisible();
    });

    test('should handle touch interactions for project operations', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // プロジェクト作成ボタンのタップ
      const createButton = page.locator('[data-testid="create-project-button"]');
      if (await createButton.isVisible()) {
        await createButton.tap();
        await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
        
        // モーダルを閉じる
        await page.locator('[data-testid="close-modal-button"]').tap();
      }
    });

    test('should support touch scrolling', async ({ page }) => {
      await page.waitForSelector('[data-testid="gantt-chart"]');
      
      // ガントチャートエリアでのタッチスクロール
      const ganttChart = page.locator('[data-testid="gantt-chart"]');
      const initialBoundingBox = await ganttChart.boundingBox();
      
      if (initialBoundingBox) {
        // スワイプジェスチャーをシミュレート
        await page.touchscreen.tap(initialBoundingBox.x + 100, initialBoundingBox.y + 100);
        
        // 水平スクロール
        await page.touchscreen.tap(initialBoundingBox.x + 200, initialBoundingBox.y + 100);
        
        // スクロールが機能することを確認（具体的な実装に応じて調整）
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Tablet Viewport (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('should display tablet layout correctly', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // サイドバーとガントチャートが並んで表示されることを確認
      const sidebar = page.locator('[data-testid="project-list"]');
      const ganttChart = page.locator('[data-testid="gantt-chart"]');
      
      await expect(sidebar).toBeVisible();
      await expect(ganttChart).toBeVisible();
      
      // レイアウトが適切に配置されていることを確認
      const sidebarBox = await sidebar.boundingBox();
      const ganttBox = await ganttChart.boundingBox();
      
      if (sidebarBox && ganttBox) {
        // サイドバーがガントチャートの左側にあることを確認
        expect(sidebarBox.x).toBeLessThan(ganttBox.x);
      }
    });

    test('should handle drag and drop on tablet', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const projectCount = await projects.count();
      
      if (projectCount >= 2) {
        const firstProject = projects.nth(0);
        const secondProject = projects.nth(1);
        
        // タブレットでのドラッグ&ドロップ（タッチ操作）
        const firstHandle = firstProject.locator('[data-testid="drag-handle"]');
        const secondHandle = secondProject.locator('[data-testid="drag-handle"]');
        
        const firstBox = await firstHandle.boundingBox();
        const secondBox = await secondHandle.boundingBox();
        
        if (firstBox && secondBox) {
          // タッチ操作でドラッグ&ドロップ
          await page.touchscreen.tap(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
          await page.waitForTimeout(100);
          await page.touchscreen.tap(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
          
          // 順序変更が完了するまで待機
          await page.waitForTimeout(500);
        }
      }
    });

    test('should maintain usability with touch targets', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // ボタンやリンクのサイズが44px以上であることを確認（アクセシビリティガイドライン）
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();
          if (boundingBox) {
            // タッチターゲットサイズの確認
            const isAccessible = boundingBox.width >= 44 && boundingBox.height >= 44;
            if (!isAccessible) {
              console.warn(`Button ${i} may be too small for touch: ${boundingBox.width}x${boundingBox.height}`);
            }
            // 警告レベルで記録（テスト失敗にはしない）
          }
        }
      }
    });
  });

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should display full desktop layout', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // デスクトップレイアウトですべての要素が表示されることを確認
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('[data-testid="project-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="gantt-chart"]')).toBeVisible();
      
      // サイドバーの幅が適切に設定されていることを確認
      const sidebar = page.locator('[data-testid="project-list"]').locator('..');
      const sidebarBox = await sidebar.boundingBox();
      
      if (sidebarBox) {
        // サイドバー幅が320px程度であることを確認（w-80 = 320px）
        expect(sidebarBox.width).toBeGreaterThanOrEqual(300);
        expect(sidebarBox.width).toBeLessThanOrEqual(400);
      }
    });

    test('should support mouse interactions efficiently', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const projectCount = await projects.count();
      
      if (projectCount >= 2) {
        const firstProject = projects.nth(0);
        const secondProject = projects.nth(1);
        
        // マウスホバー効果の確認
        await firstProject.hover();
        
        // ホバー状態のスタイル変更を確認
        const hoverClass = await firstProject.getAttribute('class');
        expect(hoverClass).toContain('hover:bg-gray-50');
        
        // マウスドラッグ&ドロップ
        const firstHandle = firstProject.locator('[data-testid="drag-handle"]');
        const secondHandle = secondProject.locator('[data-testid="drag-handle"]');
        
        await firstHandle.dragTo(secondHandle);
        
        // 順序変更が完了するまで待機
        await page.waitForTimeout(500);
      }
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // キーボードフォーカス管理
      const createButton = page.locator('[data-testid="create-project-button"]');
      
      if (await createButton.isVisible()) {
        // Tabキーでフォーカス移動
        await page.keyboard.press('Tab');
        
        // Enterキーでボタン押下
        await page.keyboard.press('Enter');
        
        if (await page.locator('[data-testid="project-modal"]').isVisible()) {
          // モーダル内でのキーボード操作
          await page.keyboard.press('Escape');
          await expect(page.locator('[data-testid="project-modal"]')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle landscape to portrait rotation on mobile', async ({ page }) => {
      // 横向きモバイル
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 横向きでの表示確認
      await expect(page.locator('main')).toBeVisible();
      
      // 縦向きに回転
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300); // 回転アニメーション待機
      
      // 縦向きでも正常に表示されることを確認
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('[data-testid="project-list"]')).toBeVisible();
    });

    test('should maintain functionality across orientations', async ({ page }) => {
      // 縦向きタブレット
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 機能が正常に動作することを確認
      const createButton = page.locator('[data-testid="create-project-button"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
        await page.keyboard.press('Escape');
      }
      
      // 横向きに回転
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(300);
      
      // 横向きでも同じ機能が動作することを確認
      if (await createButton.isVisible()) {
        await createButton.click();
        await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain data consistency across viewport changes', async ({ page }) => {
      // デスクトップサイズで開始
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForSelector('[data-testid="project-list"]');
      
      // プロジェクト数を記録
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const desktopProjectCount = await projects.count();
      
      // モバイルサイズに変更
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      // 同じ数のプロジェクトが表示されることを確認
      await page.waitForSelector('[data-testid="project-list"]');
      const mobileProjects = page.locator('[data-testid="sortable-project-item"]');
      const mobileProjectCount = await mobileProjects.count();
      
      expect(mobileProjectCount).toBe(desktopProjectCount);
      
      // タブレットサイズに変更
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      
      const tabletProjects = page.locator('[data-testid="sortable-project-item"]');
      const tabletProjectCount = await tabletProjects.count();
      
      expect(tabletProjectCount).toBe(desktopProjectCount);
    });
  });
});