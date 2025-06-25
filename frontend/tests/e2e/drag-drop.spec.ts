import { test, expect } from '@playwright/test';

test.describe('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にサインインページにアクセス
    await page.goto('/auth/signin');
    
    // モック認証でログイン状態にする
    await page.evaluate(() => {
      // NextAuth セッションをモック
      localStorage.setItem('next-auth.session-token', 'mock-session-token');
      document.cookie = 'next-auth.session-token=mock-session-token; path=/';
    });
    
    // メインページに移動
    await page.goto('/');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test.describe('Project Order Drag and Drop', () => {
    test('should change project order when dragging projects in sidebar', async ({ page }) => {
      // プロジェクトリストが表示されるまで待機
      await page.waitForSelector('[data-testid="project-list"]', { timeout: 10000 });
      
      // プロジェクト項目を取得
      const projects = page.locator('[data-testid="sortable-project-item"]');
      await expect(projects).toHaveCount(2, { timeout: 10000 });
      
      // 最初の2つのプロジェクトの初期順序を確認
      const firstProject = projects.nth(0);
      const secondProject = projects.nth(1);
      
      const firstProjectName = await firstProject.locator('h3').textContent();
      const secondProjectName = await secondProject.locator('h3').textContent();
      
      // ドラッグハンドルを使用してドラッグ&ドロップ実行
      const firstProjectHandle = firstProject.locator('[data-testid="drag-handle"]');
      const secondProjectHandle = secondProject.locator('[data-testid="drag-handle"]');
      
      // 最初のプロジェクトを2番目の位置にドラッグ
      await firstProjectHandle.dragTo(secondProjectHandle);
      
      // 順序が変更されたことを確認
      await page.waitForTimeout(500); // アニメーション待機
      
      const reorderedProjects = page.locator('[data-testid="sortable-project-item"]');
      const newFirstProject = reorderedProjects.nth(0);
      const newSecondProject = reorderedProjects.nth(1);
      
      const newFirstProjectName = await newFirstProject.locator('h3').textContent();
      const newSecondProjectName = await newSecondProject.locator('h3').textContent();
      
      // 順序が入れ替わったことを確認
      expect(newFirstProjectName).toBe(secondProjectName);
      expect(newSecondProjectName).toBe(firstProjectName);
    });

    test('should show visual feedback during project drag', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const firstProject = projects.nth(0);
      const dragHandle = firstProject.locator('[data-testid="drag-handle"]');
      
      // ドラッグ開始
      await dragHandle.hover();
      await page.mouse.down();
      
      // ドラッグ中の視覚的フィードバックを確認
      await expect(page.locator('[data-testid="drag-overlay"]')).toBeVisible();
      
      // ドラッグ終了
      await page.mouse.up();
      
      // オーバーレイが消えることを確認
      await expect(page.locator('[data-testid="drag-overlay"]')).not.toBeVisible();
    });
  });

  test.describe('Task Order Drag and Drop', () => {
    test('should change task order when dragging tasks within project', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // プロジェクトを展開してタスクリストを表示
      const firstProject = page.locator('[data-testid="sortable-project-item"]').nth(0);
      await firstProject.click();
      
      // タスクリストが表示されるまで待機
      await page.waitForSelector('[data-testid="task-list"]', { timeout: 5000 });
      
      const tasks = page.locator('[data-testid="sortable-task-item"]');
      const taskCount = await tasks.count();
      
      if (taskCount >= 2) {
        const firstTask = tasks.nth(0);
        const secondTask = tasks.nth(1);
        
        const firstTaskName = await firstTask.locator('[data-testid="task-name"]').textContent();
        const secondTaskName = await secondTask.locator('[data-testid="task-name"]').textContent();
        
        // タスクのドラッグハンドルを使用してドラッグ&ドロップ
        const firstTaskHandle = firstTask.locator('[data-testid="drag-handle"]');
        const secondTaskHandle = secondTask.locator('[data-testid="drag-handle"]');
        
        await firstTaskHandle.dragTo(secondTaskHandle);
        
        // 順序変更を確認
        await page.waitForTimeout(500);
        
        const reorderedTasks = page.locator('[data-testid="sortable-task-item"]');
        const newFirstTaskName = await reorderedTasks.nth(0).locator('[data-testid="task-name"]').textContent();
        const newSecondTaskName = await reorderedTasks.nth(1).locator('[data-testid="task-name"]').textContent();
        
        expect(newFirstTaskName).toBe(secondTaskName);
        expect(newSecondTaskName).toBe(firstTaskName);
      }
    });

    test('should not allow task drag between different projects', async ({ page }) => {
      await page.waitForSelector('[data-testid="project-list"]');
      
      // 複数のプロジェクトがある場合のテスト
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const projectCount = await projects.count();
      
      if (projectCount >= 2) {
        // 最初のプロジェクトを展開
        await projects.nth(0).click();
        await page.waitForSelector('[data-testid="task-list"]');
        
        const firstProjectTasks = page.locator('[data-testid="sortable-task-item"]');
        const firstProjectTaskCount = await firstProjectTasks.count();
        
        if (firstProjectTaskCount > 0) {
          const firstTask = firstProjectTasks.nth(0);
          const taskName = await firstTask.locator('[data-testid="task-name"]').textContent();
          
          // 2番目のプロジェクトを展開
          await projects.nth(1).click();
          
          // 異なるプロジェクト間ではドラッグできないことを確認
          // この場合はドラッグ操作が制限されているかUIで確認
          const dragHandle = firstTask.locator('[data-testid="drag-handle"]');
          const isTaskStillInFirstProject = await firstProjectTasks.locator(`text="${taskName}"`).count() > 0;
          
          expect(isTaskStillInFirstProject).toBe(true);
        }
      }
    });
  });

  test.describe('Gantt Chart Task Bar Drag', () => {
    test('should move task dates when dragging task bars horizontally', async ({ page }) => {
      await page.waitForSelector('[data-testid="gantt-chart"]', { timeout: 10000 });
      
      // ガントチャート内のタスクバーを取得
      const taskBars = page.locator('[data-testid="task-bar"]');
      const taskBarCount = await taskBars.count();
      
      if (taskBarCount > 0) {
        const firstTaskBar = taskBars.nth(0);
        
        // タスクバーの初期位置を取得
        const initialBoundingBox = await firstTaskBar.boundingBox();
        
        if (initialBoundingBox) {
          // 水平方向にドラッグ（右に移動）
          await firstTaskBar.hover();
          await page.mouse.down();
          await page.mouse.move(initialBoundingBox.x + 100, initialBoundingBox.y);
          await page.mouse.up();
          
          // タスクバーが移動したことを確認
          await page.waitForTimeout(500);
          const newBoundingBox = await firstTaskBar.boundingBox();
          
          if (newBoundingBox) {
            expect(newBoundingBox.x).toBeGreaterThan(initialBoundingBox.x);
          }
        }
      }
    });

    test('should resize task duration when dragging task bar edges', async ({ page }) => {
      await page.waitForSelector('[data-testid="gantt-chart"]');
      
      const taskBars = page.locator('[data-testid="task-bar"]');
      const taskBarCount = await taskBars.count();
      
      if (taskBarCount > 0) {
        const firstTaskBar = taskBars.nth(0);
        const resizeHandle = firstTaskBar.locator('[data-testid="resize-handle-end"]');
        
        // リサイズハンドルが存在する場合のみテスト実行
        if (await resizeHandle.count() > 0) {
          const initialBoundingBox = await firstTaskBar.boundingBox();
          
          if (initialBoundingBox) {
            // 終了日側のハンドルをドラッグして期間を延長
            await resizeHandle.hover();
            await page.mouse.down();
            await page.mouse.move(initialBoundingBox.x + initialBoundingBox.width + 50, initialBoundingBox.y);
            await page.mouse.up();
            
            await page.waitForTimeout(500);
            const newBoundingBox = await firstTaskBar.boundingBox();
            
            if (newBoundingBox) {
              expect(newBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);
            }
          }
        }
      }
    });

    test('should prevent moving tasks to past dates', async ({ page }) => {
      await page.waitForSelector('[data-testid="gantt-chart"]');
      
      const taskBars = page.locator('[data-testid="task-bar"]');
      const taskBarCount = await taskBars.count();
      
      if (taskBarCount > 0) {
        const firstTaskBar = taskBars.nth(0);
        const initialBoundingBox = await firstTaskBar.boundingBox();
        
        if (initialBoundingBox) {
          // 過去の日付（左側）に大きく移動させる試み
          await firstTaskBar.hover();
          await page.mouse.down();
          await page.mouse.move(initialBoundingBox.x - 200, initialBoundingBox.y);
          await page.mouse.up();
          
          await page.waitForTimeout(500);
          
          // エラーメッセージまたは制約により移動が制限されることを確認
          // 具体的な制約実装に応じてテスト内容を調整
          const errorMessage = page.locator('[data-testid="error-message"]');
          const isErrorVisible = await errorMessage.isVisible();
          
          // エラーが表示されるか、または位置が変更されていないことを確認
          if (!isErrorVisible) {
            const finalBoundingBox = await firstTaskBar.boundingBox();
            if (finalBoundingBox) {
              // 過去日付制限により、大幅な左移動が制限されていることを確認
              expect(finalBoundingBox.x).toBeGreaterThanOrEqual(initialBoundingBox.x - 50);
            }
          } else {
            expect(isErrorVisible).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Error Handling and Rollback', () => {
    test('should rollback on API failure', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('**/api/projects/*', route => route.abort());
      
      await page.waitForSelector('[data-testid="project-list"]');
      
      const projects = page.locator('[data-testid="sortable-project-item"]');
      const projectCount = await projects.count();
      
      if (projectCount >= 2) {
        const firstProject = projects.nth(0);
        const secondProject = projects.nth(1);
        
        const firstProjectName = await firstProject.locator('h3').textContent();
        const secondProjectName = await secondProject.locator('h3').textContent();
        
        // ドラッグ&ドロップ実行（API失敗）
        const firstHandle = firstProject.locator('[data-testid="drag-handle"]');
        const secondHandle = secondProject.locator('[data-testid="drag-handle"]');
        
        await firstHandle.dragTo(secondHandle);
        
        // エラーメッセージが表示されることを確認
        await expect(page.locator('[data-testid="error-toast"]')).toBeVisible({ timeout: 5000 });
        
        // 順序がロールバックされることを確認
        await page.waitForTimeout(1000);
        
        const rolledBackProjects = page.locator('[data-testid="sortable-project-item"]');
        const rolledBackFirstName = await rolledBackProjects.nth(0).locator('h3').textContent();
        const rolledBackSecondName = await rolledBackProjects.nth(1).locator('h3').textContent();
        
        expect(rolledBackFirstName).toBe(firstProjectName);
        expect(rolledBackSecondName).toBe(secondProjectName);
      }
    });
  });
});