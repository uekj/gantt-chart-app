import { test, expect } from '@playwright/test';

test.describe('CRUD Operations', () => {
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

  test.describe('Project CRUD Operations', () => {
    test('should create a new project', async ({ page }) => {
      // プロジェクト作成ボタンをクリック
      await page.click('[data-testid="create-project-button"]');
      
      // プロジェクト作成モーダルが表示されることを確認
      await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
      
      // プロジェクト名を入力
      const projectName = `テストプロジェクト ${Date.now()}`;
      await page.fill('[data-testid="project-name-input"]', projectName);
      
      // 開始日を設定
      const today = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="project-start-date-input"]', today);
      
      // 保存ボタンをクリック
      await page.click('[data-testid="save-project-button"]');
      
      // モーダルが閉じることを確認
      await expect(page.locator('[data-testid="project-modal"]')).not.toBeVisible();
      
      // 新しいプロジェクトがリストに追加されることを確認
      await expect(page.locator(`text="${projectName}"`)).toBeVisible();
    });

    test('should edit an existing project', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 最初のプロジェクトの編集ボタンをクリック
      const firstProject = page.locator('[data-testid="sortable-project-item"]').nth(0);
      await firstProject.locator('[data-testid="edit-project-button"]').click();
      
      // プロジェクト編集モーダルが表示されることを確認
      await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
      
      // プロジェクト名を変更
      const newProjectName = `編集済みプロジェクト ${Date.now()}`;
      await page.fill('[data-testid="project-name-input"]', newProjectName);
      
      // 保存ボタンをクリック
      await page.click('[data-testid="save-project-button"]');
      
      // モーダルが閉じることを確認
      await expect(page.locator('[data-testid="project-modal"]')).not.toBeVisible();
      
      // 変更されたプロジェクト名が表示されることを確認
      await expect(page.locator(`text="${newProjectName}"`)).toBeVisible();
    });

    test('should delete a project', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const initialCount = await projects.count();
      
      if (initialCount > 0) {
        // 最初のプロジェクトの編集ボタンをクリック
        const firstProject = projects.nth(0);
        const projectName = await firstProject.locator('h3').textContent();
        
        await firstProject.locator('[data-testid="edit-project-button"]').click();
        await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
        
        // 削除ボタンをクリック
        await page.click('[data-testid="delete-project-button"]');
        
        // 確認ダイアログが表示された場合は確認
        const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
        if (await confirmDialog.isVisible()) {
          await page.click('[data-testid="confirm-delete-button"]');
        }
        
        // モーダルが閉じることを確認
        await expect(page.locator('[data-testid="project-modal"]')).not.toBeVisible();
        
        // プロジェクトがリストから削除されることを確認
        if (projectName) {
          await expect(page.locator(`text="${projectName}"`)).not.toBeVisible();
        }
        
        // プロジェクト数が減ることを確認
        const newCount = await page.locator('[data-testid="sortable-project-item"]').count();
        expect(newCount).toBeLessThan(initialCount);
      }
    });
  });

  test.describe('Task CRUD Operations', () => {
    test('should create a new task', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // プロジェクトを展開
      const firstProject = page.locator('[data-testid="sortable-project-item"]').nth(0);
      await firstProject.click();
      
      // タスク追加ボタンをクリック
      await page.click('[data-testid="add-task-button"]');
      
      // タスク作成モーダルが表示されることを確認
      await expect(page.locator('[data-testid="task-modal"]')).toBeVisible();
      
      // タスク情報を入力
      const taskName = `テストタスク ${Date.now()}`;
      await page.fill('[data-testid="task-name-input"]', taskName);
      
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await page.fill('[data-testid="task-start-date-input"]', startDate);
      await page.fill('[data-testid="task-end-date-input"]', endDate);
      
      // 保存ボタンをクリック
      await page.click('[data-testid="save-task-button"]');
      
      // モーダルが閉じることを確認
      await expect(page.locator('[data-testid="task-modal"]')).not.toBeVisible();
      
      // 新しいタスクがリストに追加されることを確認
      await expect(page.locator(`text="${taskName}"`)).toBeVisible();
    });

    test('should edit an existing task', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // プロジェクトを展開
      const firstProject = page.locator('[data-testid="sortable-project-item"]').nth(0);
      await firstProject.click();
      
      await page.waitForSelector('[data-testid="task-list"]');
      
      const tasks = page.locator('[data-testid="sortable-task-item"]');
      const taskCount = await tasks.count();
      
      if (taskCount > 0) {
        // 最初のタスクをクリックして編集
        await tasks.nth(0).click();
        
        // タスク編集モーダルが表示されることを確認
        await expect(page.locator('[data-testid="task-modal"]')).toBeVisible();
        
        // タスク名を変更
        const newTaskName = `編集済みタスク ${Date.now()}`;
        await page.fill('[data-testid="task-name-input"]', newTaskName);
        
        // 保存ボタンをクリック
        await page.click('[data-testid="save-task-button"]');
        
        // モーダルが閉じることを確認
        await expect(page.locator('[data-testid="task-modal"]')).not.toBeVisible();
        
        // 変更されたタスク名が表示されることを確認
        await expect(page.locator(`text="${newTaskName}"`)).toBeVisible();
      }
    });

    test('should delete a task', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // プロジェクトを展開
      const firstProject = page.locator('[data-testid="sortable-project-item"]').nth(0);
      await firstProject.click();
      
      await page.waitForSelector('[data-testid="task-list"]');
      
      const tasks = page.locator('[data-testid="sortable-task-item"]');
      const initialCount = await tasks.count();
      
      if (initialCount > 0) {
        const firstTask = tasks.nth(0);
        const taskName = await firstTask.locator('[data-testid="task-name"]').textContent();
        
        // タスクをクリックして編集モーダルを開く
        await firstTask.click();
        await expect(page.locator('[data-testid="task-modal"]')).toBeVisible();
        
        // 削除ボタンをクリック
        await page.click('[data-testid="delete-task-button"]');
        
        // 確認ダイアログが表示された場合は確認
        const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
        if (await confirmDialog.isVisible()) {
          await page.click('[data-testid="confirm-delete-button"]');
        }
        
        // モーダルが閉じることを確認
        await expect(page.locator('[data-testid="task-modal"]')).not.toBeVisible();
        
        // タスクがリストから削除されることを確認
        if (taskName) {
          await expect(page.locator(`text="${taskName}"`)).not.toBeVisible();
        }
        
        // タスク数が減ることを確認
        const newCount = await page.locator('[data-testid="sortable-task-item"]').count();
        expect(newCount).toBeLessThan(initialCount);
      }
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data after page reload', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 現在のプロジェクト一覧を取得
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const projectCount = await projects.count();
      const projectNames = [];
      
      for (let i = 0; i < Math.min(projectCount, 3); i++) {
        const name = await projects.nth(i).locator('h3').textContent();
        if (name) projectNames.push(name);
      }
      
      // ページをリロード
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="project-list"]');
      
      // データが保持されていることを確認
      for (const name of projectNames) {
        await expect(page.locator(`text="${name}"`)).toBeVisible();
      }
    });

    test('should maintain data consistency across multiple operations', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 複数の操作を連続実行
      const testProjectName = `整合性テスト ${Date.now()}`;
      
      // 1. プロジェクト作成
      await page.click('[data-testid="create-project-button"]');
      await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
      await page.fill('[data-testid="project-name-input"]', testProjectName);
      await page.fill('[data-testid="project-start-date-input"]', new Date().toISOString().split('T')[0]);
      await page.click('[data-testid="save-project-button"]');
      await expect(page.locator('[data-testid="project-modal"]')).not.toBeVisible();
      
      // プロジェクトが作成されたことを確認
      await expect(page.locator(`text="${testProjectName}"`)).toBeVisible();
      
      // 2. 作成したプロジェクトを展開してタスク追加
      const createdProject = page.locator(`text="${testProjectName}"`).locator('..');
      await createdProject.click();
      
      const testTaskName = `整合性テストタスク ${Date.now()}`;
      await page.click('[data-testid="add-task-button"]');
      await expect(page.locator('[data-testid="task-modal"]')).toBeVisible();
      await page.fill('[data-testid="task-name-input"]', testTaskName);
      await page.fill('[data-testid="task-start-date-input"]', new Date().toISOString().split('T')[0]);
      await page.fill('[data-testid="task-end-date-input"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      await page.click('[data-testid="save-task-button"]');
      await expect(page.locator('[data-testid="task-modal"]')).not.toBeVisible();
      
      // タスクが作成されたことを確認
      await expect(page.locator(`text="${testTaskName}"`)).toBeVisible();
      
      // 3. データの整合性を確認
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 作成したプロジェクトとタスクが両方存在することを確認
      await expect(page.locator(`text="${testProjectName}"`)).toBeVisible();
      
      const reloadedProject = page.locator(`text="${testProjectName}"`).locator('..');
      await reloadedProject.click();
      await expect(page.locator(`text="${testTaskName}"`)).toBeVisible();
    });
  });

  test.describe('Validation and Error Handling', () => {
    test('should validate required fields in project creation', async ({ page }) => {
      await page.click('[data-testid="create-project-button"]');
      await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
      
      // 空のフォームで保存を試行
      await page.click('[data-testid="save-project-button"]');
      
      // バリデーションエラーが表示されることを確認
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      
      // モーダルが開いたままであることを確認
      await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
    });

    test('should validate task date constraints', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      const firstProject = page.locator('[data-testid="sortable-project-item"]').nth(0);
      await firstProject.click();
      
      await page.click('[data-testid="add-task-button"]');
      await expect(page.locator('[data-testid="task-modal"]')).toBeVisible();
      
      // 無効な日付範囲を設定（終了日が開始日より前）
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      await page.fill('[data-testid="task-name-input"]', 'バリデーションテストタスク');
      await page.fill('[data-testid="task-start-date-input"]', tomorrow.toISOString().split('T')[0]);
      await page.fill('[data-testid="task-end-date-input"]', today.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-task-button"]');
      
      // バリデーションエラーが表示されることを確認
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      
      // モーダルが開いたままであることを確認
      await expect(page.locator('[data-testid="task-modal"]')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('**/api/projects', route => route.abort());
      
      await page.waitForSelector('[data-testid="project-list"]');
      
      await page.click('[data-testid="create-project-button"]');
      await expect(page.locator('[data-testid="project-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="project-name-input"]', 'ネットワークエラーテスト');
      await page.fill('[data-testid="project-start-date-input"]', new Date().toISOString().split('T')[0]);
      await page.click('[data-testid="save-project-button"]');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });
});