import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateProjectOrder, updateTaskOrder, ReorderResult } from './api-client'

// fetch のモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client - 順序変更API呼び出し', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('updateProjectOrder', () => {
    it('プロジェクトの順序更新が成功する場合', async () => {
      const mockResponse = {
        id: 1,
        name: 'Test Project',
        start_date: '2024-01-01',
        display_order: 1500,
        user_id: 'user123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await updateProjectOrder(1, 1500)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_order: 1500 })
      })
    })

    it('プロジェクトの順序更新が失敗する場合', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Project not found' })
      })

      const result = await updateProjectOrder(999, 1500)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project not found')
      expect(result.status).toBe(404)
    })

    it('ネットワークエラーの場合', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await updateProjectOrder(1, 1500)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('updateTaskOrder', () => {
    it('タスクの順序更新が成功する場合', async () => {
      const mockResponse = {
        id: 1,
        project_id: 1,
        name: 'Test Task',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        display_order: 2500
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await updateTaskOrder(1, 2500)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_order: 2500 })
      })
    })

    it('タスクの順序更新が失敗する場合', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Unauthorized' })
      })

      const result = await updateTaskOrder(1, 2500)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
      expect(result.status).toBe(403)
    })
  })

  describe('ReorderResult型チェック', () => {
    it('成功時の型が正しい', async () => {
      const mockResponse = { id: 1, display_order: 1500 }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await updateProjectOrder(1, 1500)

      // TypeScript型チェック
      if (result.success) {
        expect(result.data).toBeDefined()
        expect(result.data.id).toBe(1)
        expect(result.data.display_order).toBe(1500)
        // error プロパティは存在しない
        expect('error' in result).toBe(false)
      }
    })

    it('失敗時の型が正しい', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad Request' })
      })

      const result = await updateProjectOrder(1, 1500)

      // TypeScript型チェック
      if (!result.success) {
        expect(result.error).toBe('Bad Request')
        expect(result.status).toBe(400)
        // data プロパティは存在しない
        expect('data' in result).toBe(false)
      }
    })
  })

  describe('エラーハンドリング', () => {
    it('JSONパースエラーの場合', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const result = await updateProjectOrder(1, 1500)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON')
      expect(result.status).toBe(500)
    })

    it('タイムアウトエラーの場合', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      const result = await updateTaskOrder(1, 2500)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Request timeout')
    })
  })
})