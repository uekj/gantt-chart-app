export type ReorderResult<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string; status?: number }

/**
 * プロジェクトの順序を更新
 * @param projectId プロジェクトID
 * @param displayOrder 新しい順序値
 * @returns 更新結果
 */
export async function updateProjectOrder(
  projectId: number, 
  displayOrder: number
): Promise<ReorderResult> {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ display_order: displayOrder })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, data }
    } else {
      try {
        const errorData = await response.json()
        return { 
          success: false, 
          error: errorData.error || 'Unknown error',
          status: response.status
        }
      } catch (parseError) {
        return {
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Parse error',
          status: response.status
        }
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * タスクの順序を更新
 * @param taskId タスクID
 * @param displayOrder 新しい順序値
 * @returns 更新結果
 */
export async function updateTaskOrder(
  taskId: number, 
  displayOrder: number
): Promise<ReorderResult> {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ display_order: displayOrder })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, data }
    } else {
      try {
        const errorData = await response.json()
        return { 
          success: false, 
          error: errorData.error || 'Unknown error',
          status: response.status
        }
      } catch (parseError) {
        return {
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Parse error',
          status: response.status
        }
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}