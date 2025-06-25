import { describe, it, expect } from 'vitest'
import { 
  calculateNewOrder, 
  reorderItems, 
  validateOrderValues,
  OrderItem 
} from './order-utils'

describe('Order Utils - Gap方式順序値計算', () => {
  describe('calculateNewOrder', () => {
    it('配列の先頭に挿入する場合', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 },
        { id: 3, display_order: 3000 }
      ]
      
      const newOrder = calculateNewOrder(items, 0, 2) // item[2]を先頭に移動
      expect(newOrder).toBe(500) // 1000の半分
    })

    it('配列の中間に挿入する場合', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 },
        { id: 3, display_order: 3000 }
      ]
      
      // item[0] (1000) を index 1 (2000の位置) に移動
      // 結果として 1000は 2000と3000の間に入る
      const newOrder = calculateNewOrder(items, 1, 0) 
      expect(newOrder).toBe(2500) // (2000 + 3000) / 2
    })

    it('配列の末尾に挿入する場合', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 },
        { id: 3, display_order: 3000 }
      ]
      
      const newOrder = calculateNewOrder(items, 2, 0) // item[0]を末尾に移動
      expect(newOrder).toBe(4000) // 3000 + 1000
    })

    it('隣接する値の間に挿入する場合（狭い間隔）', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 1001 },
        { id: 3, display_order: 1002 }
      ]
      
      const newOrder = calculateNewOrder(items, 1, 2) // item[2]を1と2の間に移動
      expect(newOrder).toBe(1000.5) // (1000 + 1001) / 2
    })
  })

  describe('reorderItems', () => {
    it('配列の順序を正しく変更する', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 },
        { id: 3, display_order: 3000 }
      ]
      
      const result = reorderItems(items, 2, 0) // item[2]を先頭に移動
      
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe(3) // 移動した項目が先頭に
      expect(result[0].display_order).toBe(500)
      expect(result[1].id).toBe(1)
      expect(result[2].id).toBe(2)
    })

    it('同じ位置への移動は何も変更しない', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 }
      ]
      
      const result = reorderItems(items, 0, 0)
      expect(result).toEqual(items)
    })
  })

  describe('validateOrderValues', () => {
    it('正常な順序値の場合はtrueを返す', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 2000 },
        { id: 3, display_order: 3000 }
      ]
      
      expect(validateOrderValues(items)).toBe(true)
    })

    it('重複する順序値の場合はfalseを返す', () => {
      const items = [
        { id: 1, display_order: 1000 },
        { id: 2, display_order: 1000 }, // 重複
        { id: 3, display_order: 3000 }
      ]
      
      expect(validateOrderValues(items)).toBe(false)
    })

    it('順序が逆転している場合はfalseを返す', () => {
      const items = [
        { id: 1, display_order: 3000 },
        { id: 2, display_order: 2000 }, // 逆転
        { id: 3, display_order: 1000 }
      ]
      
      expect(validateOrderValues(items)).toBe(false)
    })

    it('空の配列の場合はtrueを返す', () => {
      expect(validateOrderValues([])).toBe(true)
    })
  })

  describe('エッジケース', () => {
    it('単一項目の配列でも正しく処理する', () => {
      const items = [{ id: 1, display_order: 1000 }]
      const result = reorderItems(items, 0, 0)
      expect(result).toEqual(items)
    })

    it('数値の精度が失われる場合を考慮する', () => {
      const items = [
        { id: 1, display_order: 1 },
        { id: 2, display_order: 2 }
      ]
      
      // 多数回の操作でも数値精度を保つ
      let result = items
      for (let i = 0; i < 10; i++) {
        result = reorderItems(result, 1, 0)
        result = reorderItems(result, 1, 0) // 戻す
      }
      
      expect(result.every(item => 
        Number.isFinite(item.display_order)
      )).toBe(true)
    })
  })
})