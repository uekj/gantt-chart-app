# API設計の問題と解決策

## 現在の問題

### 1. Next.js 15の仕様変更
- **問題**: `params.id`の同期的アクセスでエラー
- **原因**: Next.js 15では`params`が非同期になった
- **エラー**: `params should be awaited before using its properties`

### 2. 型定義の不一致
- **DBスキーマ**: `projectId`, `startDate`, `endDate`, `displayOrder`
- **フロントエンド型**: `project_id`, `start_date`, `end_date`, `display_order`
- **問題**: APIレスポンスでの変換が不完全

### 3. 日付検証ロジックの分散
- **フロントエンド**: ガントチャートでの過去日付制限
- **API**: 複数箇所での異なる検証ルール
- **問題**: ドラッグ&ドロップとフォーム編集で異なる要件

### 4. ドラッグ&ドロップの特殊要件
- **要件**: 過去日付への移動を許可
- **現状**: 過去日付チェックでエラー
- **問題**: 編集モードとドラッグモードの区別が不十分

## 解決策の設計

### 1. 型定義の統一
```typescript
// 共通型定義 (shared/types.ts)
export interface Task {
  id: number
  project_id: number
  name: string
  start_date: string  // YYYY-MM-DD
  end_date: string    // YYYY-MM-DD
  display_order: number
}

// DBスキーマから前端型への変換関数
export function taskDbToApi(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    project_id: dbTask.projectId,
    name: dbTask.name,
    start_date: dbTask.startDate,
    end_date: dbTask.endDate,
    display_order: dbTask.displayOrder,
  }
}
```

### 2. API設計の統一
```typescript
// 全APIエンドポイントで共通の処理
async function handleApiRequest<T>(
  handler: (params: any) => Promise<T>,
  params: any
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    await initializeLocalDatabase()
    const result = await handler(await params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### 3. 検証ロジックの階層化
```typescript
// 検証タイプの定義
type ValidationContext = 'create' | 'edit' | 'drag'

// 日付検証ルール
const VALIDATION_RULES = {
  create: {
    allowPastDates: false,
    requireProjectStartCheck: true,
    requireEndAfterStart: true,
  },
  edit: {
    allowPastDates: false,
    requireProjectStartCheck: true,
    requireEndAfterStart: true,
  },
  drag: {
    allowPastDates: true,  // ドラッグ時は過去日付OK
    requireProjectStartCheck: false,
    requireEndAfterStart: true,
  }
}
```

### 4. APIエンドポイント構造
```
POST /api/tasks           # タスク作成 (validation: create)
PUT  /api/tasks/[id]      # タスク更新 (validation: edit)
PUT  /api/tasks/[id]/move # ドラッグ専用 (validation: drag)
GET  /api/tasks           # タスク一覧
GET  /api/tasks/[id]      # タスク詳細
DELETE /api/tasks/[id]    # タスク削除
```

### 5. フロントエンド側の責務分離
```typescript
// useProjects.ts
const updateTask = (id: number, updates: Partial<Task>, context: ValidationContext = 'edit') => {
  if (context === 'drag') {
    return apiClient.moveTask(id, updates)
  } else {
    return apiClient.updateTask(id, updates)
  }
}

// GanttChart.tsx
const handleDragUpdate = (taskId: number, updates: Partial<Task>) => {
  onTaskUpdate?.(taskId, updates, 'drag')  // ドラッグ専用コンテキスト
}
```

## 実装計画

### Phase 1: 基盤修正
1. Next.js 15対応 (`await params`)
2. 型変換関数の作成
3. 共通API処理関数の作成

### Phase 2: 検証ロジック統一
1. 検証コンテキストの導入
2. ドラッグ専用エンドポイントの作成
3. 各エンドポイントでの検証適用

### Phase 3: フロントエンド修正
1. useProjects hookでのコンテキスト対応
2. ガントチャートでのドラッグ専用API使用
3. 過去日付制限の除去

### Phase 4: テスト・検証
1. 各操作パターンのテスト
2. エラーハンドリングの確認
3. ユーザビリティの検証

## 期待される効果

1. **技術的安定性**: Next.js 15仕様への完全対応
2. **保守性向上**: 型安全性とコード重複の削減
3. **ユーザビリティ**: ドラッグ&ドロップの制限緩和
4. **拡張性**: 新しい検証ルールの追加が容易

## 注意点

- 既存データとの互換性維持
- パフォーマンスへの影響を最小限に
- エラーメッセージの日本語対応
- ログ出力の充実化