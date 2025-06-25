import { reorderItems, OrderItem } from './order-utils'
import { updateProjectOrder, updateTaskOrder, ReorderResult } from './api-client'

export interface ReorderOperation {
  id: string
  type: 'project' | 'task'
  itemId: number
  oldOrder: number
  newOrder: number
  fromIndex: number
  toIndex: number
}

export interface DragDropState {
  pendingOperations: ReorderOperation[]
  isProcessing: boolean
  lastError?: string
}

export class DragDropStateManager {
  private state: DragDropState = {
    pendingOperations: [],
    isProcessing: false
  }

  private readonly MAX_PENDING_OPERATIONS = 3

  /**
   * 楽観的更新でプロジェクトの順序を変更
   */
  optimisticReorderProjects(
    projects: OrderItem[], 
    fromIndex: number, 
    toIndex: number
  ): OrderItem[] {
    this.validateIndices(projects, fromIndex, toIndex)
    return reorderItems(projects, fromIndex, toIndex)
  }

  /**
   * 楽観的更新でタスクの順序を変更
   */
  optimisticReorderTasks(
    tasks: OrderItem[], 
    fromIndex: number, 
    toIndex: number
  ): OrderItem[] {
    this.validateIndices(tasks, fromIndex, toIndex)
    return reorderItems(tasks, fromIndex, toIndex)
  }

  /**
   * APIと同期
   */
  async syncWithAPI(operation: ReorderOperation): Promise<ReorderResult> {
    this.state.isProcessing = true

    try {
      if (operation.type === 'project') {
        return await updateProjectOrder(operation.itemId, operation.newOrder)
      } else {
        return await updateTaskOrder(operation.itemId, operation.newOrder)
      }
    } finally {
      this.state.isProcessing = false
    }
  }

  /**
   * 操作をロールバック
   */
  rollbackOperation(
    currentItems: OrderItem[], 
    operation: ReorderOperation
  ): OrderItem[] {
    // 元の順序値に戻す
    const rolledBackItems = currentItems.map(item => 
      item.id === operation.itemId 
        ? { ...item, display_order: operation.oldOrder }
        : item
    )

    // 元の位置に戻す
    return reorderItems(rolledBackItems, operation.toIndex, operation.fromIndex)
  }

  /**
   * 操作を履歴に追加
   */
  addOperation(operation: ReorderOperation): void {
    // 重複チェック
    if (this.state.pendingOperations.some(op => op.id === operation.id)) {
      throw new Error('Operation already exists')
    }

    // 制限チェック
    if (this.state.pendingOperations.length >= this.MAX_PENDING_OPERATIONS) {
      // 最も古い操作を削除
      this.state.pendingOperations.shift()
    }

    this.state.pendingOperations.push(operation)
  }

  /**
   * 操作を完了として履歴から削除
   */
  completeOperation(operationId: string): void {
    this.state.pendingOperations = this.state.pendingOperations.filter(
      op => op.id !== operationId
    )
  }

  /**
   * エラーを設定
   */
  setError(error: string): void {
    this.state.lastError = error
  }

  /**
   * エラーをクリア
   */
  clearError(): void {
    this.state.lastError = undefined
  }

  /**
   * 現在の状態を取得
   */
  getState(): DragDropState {
    return { ...this.state }
  }

  /**
   * 状態をリセット
   */
  reset(): void {
    this.state = {
      pendingOperations: [],
      isProcessing: false
    }
  }

  /**
   * インデックスの妥当性をチェック
   */
  private validateIndices(items: OrderItem[], fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      throw new Error('Invalid index range')
    }
  }
}