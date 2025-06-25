export interface OrderItem {
  id: number
  display_order: number
}

/**
 * Gap方式での新しい順序値を計算
 * @param items 現在の項目リスト
 * @param newIndex 新しい挿入位置
 * @param currentIndex 移動する項目の現在の位置
 * @returns 新しい順序値
 */
export function calculateNewOrder(
  items: OrderItem[], 
  newIndex: number, 
  currentIndex: number
): number {
  // 同じ位置への移動の場合
  if (newIndex === currentIndex) {
    return items[currentIndex].display_order
  }

  if (newIndex === 0) {
    // 先頭に挿入
    const firstOrder = items[0].display_order === items[currentIndex].display_order 
      ? items[1]?.display_order ?? 1000 
      : items[0].display_order
    return firstOrder / 2
  } else if (newIndex >= items.length - 1) {
    // 末尾に挿入
    const lastIndex = items.length - 1
    const lastOrder = items[lastIndex].display_order === items[currentIndex].display_order
      ? items[lastIndex - 1]?.display_order ?? 0
      : items[lastIndex].display_order
    return lastOrder + 1000
  } else {
    // 中間に挿入 - インデックス調整が必要
    let prevOrder: number
    let nextOrder: number
    
    if (currentIndex < newIndex) {
      // 後ろに移動する場合
      prevOrder = items[newIndex].display_order
      nextOrder = items[newIndex + 1]?.display_order ?? (items[newIndex].display_order + 1000)
    } else {
      // 前に移動する場合
      prevOrder = items[newIndex - 1].display_order
      nextOrder = items[newIndex].display_order
    }
    
    return (prevOrder + nextOrder) / 2
  }
}

/**
 * 項目の順序を変更し、新しい順序値を計算
 * @param items 項目リスト
 * @param fromIndex 移動元のインデックス
 * @param toIndex 移動先のインデックス
 * @returns 順序変更後の項目リスト
 */
export function reorderItems(
  items: OrderItem[], 
  fromIndex: number, 
  toIndex: number
): OrderItem[] {
  if (fromIndex === toIndex) {
    return items
  }

  const newOrder = calculateNewOrder(items, toIndex, fromIndex)
  const newItems = [...items]
  
  // 移動する項目の順序値を更新
  newItems[fromIndex] = {
    ...newItems[fromIndex],
    display_order: newOrder
  }
  
  // 配列の順序を変更
  const [movedItem] = newItems.splice(fromIndex, 1)
  newItems.splice(toIndex, 0, movedItem)
  
  return newItems
}

/**
 * 順序値の妥当性を検証
 * @param items 項目リスト
 * @returns 妥当な場合true
 */
export function validateOrderValues(items: OrderItem[]): boolean {
  if (items.length === 0) return true
  
  // 重複チェック
  const orderValues = items.map(item => item.display_order)
  const uniqueValues = new Set(orderValues)
  if (uniqueValues.size !== orderValues.length) {
    return false
  }
  
  // 順序チェック
  for (let i = 1; i < items.length; i++) {
    if (items[i].display_order <= items[i - 1].display_order) {
      return false
    }
  }
  
  return true
}