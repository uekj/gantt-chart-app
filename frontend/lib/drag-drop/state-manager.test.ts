import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DragDropStateManager, DragDropState, ReorderOperation } from './state-manager'

// API client のモック
vi.mock('./api-client', () => ({
  updateProjectOrder: vi.fn(),
  updateTaskOrder: vi.fn()
}))

import { updateProjectOrder, updateTaskOrder } from './api-client'

describe('DragDropStateManager - 状態管理ロジック', () => {
  let stateManager: DragDropStateManager
  const mockUpdateProjectOrder = vi.mocked(updateProjectOrder)
  const mockUpdateTaskOrder = vi.mocked(updateTaskOrder)

  beforeEach(() => {
    stateManager = new DragDropStateManager()
    mockUpdateProjectOrder.mockClear()
    mockUpdateTaskOrder.mockClear()
  })

  describe('楽観的更新', () => {
    it('プロジェクトの順序変更が即座に状態に反映される', () => {
      const projects = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 },
        { id: 3, display_order: 3000 }
      ]

      const result = stateManager.optimisticReorderProjects(projects, 2, 0)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe(3) // 移動した項目が先頭に
      expect(result[0].display_order).toBe(500) // 新しい順序値
      expect(result[1].id).toBe(1)
      expect(result[2].id).toBe(2)
    })

    it('タスクの順序変更が即座に状態に反映される', () => {
      const tasks = [
        { id: 1, project_id: 1, display_order: 1000 },
        { id: 2, project_id: 1, display_order: 2000 }
      ]

      const result = stateManager.optimisticReorderTasks(tasks, 1, 0)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(2) // 移動した項目が先頭に
      expect(result[0].display_order).toBe(500)
      expect(result[1].id).toBe(1)
    })
  })

  describe('API同期処理', () => {
    it('プロジェクト順序変更のAPI呼び出しが成功する場合', async () => {
      mockUpdateProjectOrder.mockResolvedValueOnce({
        success: true,
        data: { id: 1, display_order: 1500 }
      })

      const operation: ReorderOperation = {
        id: 'op1',
        type: 'project',
        itemId: 1,
        oldOrder: 1000,
        newOrder: 1500,
        fromIndex: 1,
        toIndex: 0
      }

      const result = await stateManager.syncWithAPI(operation)

      expect(result.success).toBe(true)
      expect(mockUpdateProjectOrder).toHaveBeenCalledWith(1, 1500)
    })

    it('タスク順序変更のAPI呼び出しが成功する場合', async () => {
      mockUpdateTaskOrder.mockResolvedValueOnce({
        success: true,
        data: { id: 2, display_order: 2500 }
      })

      const operation: ReorderOperation = {
        id: 'op2',
        type: 'task',
        itemId: 2,
        oldOrder: 2000,
        newOrder: 2500,
        fromIndex: 0,
        toIndex: 1
      }

      const result = await stateManager.syncWithAPI(operation)

      expect(result.success).toBe(true)
      expect(mockUpdateTaskOrder).toHaveBeenCalledWith(2, 2500)
    })

    it('API呼び出しが失敗する場合', async () => {
      mockUpdateProjectOrder.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
        status: 500
      })

      const operation: ReorderOperation = {
        id: 'op3',
        type: 'project',
        itemId: 1,
        oldOrder: 1000,
        newOrder: 1500,
        fromIndex: 1,
        toIndex: 0
      }

      const result = await stateManager.syncWithAPI(operation)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('ロールバック機能', () => {
    it('API失敗時に元の状態に戻る', () => {
      // 楽観的更新後の状態（3が先頭に移動済み）
      const currentProjects = [
        { id: 3, display_order: 500 },  // 移動済み
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 }
      ]

      const operation: ReorderOperation = {
        id: 'op4',
        type: 'project',
        itemId: 3,
        oldOrder: 3000,  // 元の順序値
        newOrder: 500,   // 移動後の順序値
        fromIndex: 2,    // 元の位置
        toIndex: 0       // 移動先
      }

      const rolledBack = stateManager.rollbackOperation(currentProjects, operation)

      expect(rolledBack).toHaveLength(3)
      expect(rolledBack[0].id).toBe(1) // 元の順序に戻る
      expect(rolledBack[1].id).toBe(2)
      expect(rolledBack[2].id).toBe(3) // 元の位置に戻る
      expect(rolledBack[2].display_order).toBe(3000) // 元の順序値に戻る
    })
  })

  describe('状態管理', () => {
    it('操作履歴が正しく記録される', () => {
      const operation: ReorderOperation = {
        id: 'op5',
        type: 'project',
        itemId: 1,
        oldOrder: 1000,
        newOrder: 1500,
        fromIndex: 1,
        toIndex: 0
      }

      stateManager.addOperation(operation)

      const state = stateManager.getState()
      expect(state.pendingOperations).toHaveLength(1)
      expect(state.pendingOperations[0]).toEqual(operation)
    })

    it('操作完了時に履歴から削除される', () => {
      const operation: ReorderOperation = {
        id: 'op6',
        type: 'project',
        itemId: 1,
        oldOrder: 1000,
        newOrder: 1500,
        fromIndex: 1,
        toIndex: 0
      }

      stateManager.addOperation(operation)
      stateManager.completeOperation('op6')

      const state = stateManager.getState()
      expect(state.pendingOperations).toHaveLength(0)
    })

    it('同時操作数の制限', () => {
      // 複数の操作を追加
      for (let i = 0; i < 5; i++) {
        stateManager.addOperation({
          id: `op${i}`,
          type: 'project',
          itemId: i,
          oldOrder: i * 1000,
          newOrder: (i + 1) * 1000,
          fromIndex: i,
          toIndex: i + 1
        })
      }

      const state = stateManager.getState()
      expect(state.pendingOperations.length).toBeLessThanOrEqual(3) // 最大3つまで
    })
  })

  describe('エラーハンドリング', () => {
    it('無効な操作を拒否する', () => {
      const projects = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 }
      ]

      // 範囲外のインデックス
      expect(() => {
        stateManager.optimisticReorderProjects(projects, 5, 0)
      }).toThrow('Invalid index range')
    })

    it('重複するIDの操作を防ぐ', () => {
      const operation: ReorderOperation = {
        id: 'op7',
        type: 'project',
        itemId: 1,
        oldOrder: 1000,
        newOrder: 1500,
        fromIndex: 1,
        toIndex: 0
      }

      stateManager.addOperation(operation)
      
      // 同じIDの操作を再度追加
      expect(() => {
        stateManager.addOperation(operation)
      }).toThrow('Operation already exists')
    })
  })
})