'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Task } from '../../../shared/types'
import { SortableTaskItem } from './SortableTaskItem'
import { useDragDropState } from './DragDropProvider'

interface SortableTaskListProps {
  tasks: Task[]
  projectId: number
  onCreateTask: () => void
  onEditTask: (task: Task) => void
  onTaskOrderChange: (reorderedTasks: Task[]) => void
}

export function SortableTaskList({
  tasks,
  projectId,
  onCreateTask,
  onEditTask,
  onTaskOrderChange,
}: SortableTaskListProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const stateManager = useDragDropState()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    try {
      // 楽観的更新
      const reorderedTasks = stateManager.optimisticReorderTasks(
        tasks,
        oldIndex,
        newIndex
      )
      onTaskOrderChange(reorderedTasks)

      // API同期
      const movingTask = tasks[oldIndex]
      const newOrder = reorderedTasks[newIndex].display_order
      
      const operation = {
        id: `task-${Date.now()}`,
        type: 'task' as const,
        itemId: movingTask.id,
        oldOrder: movingTask.display_order,
        newOrder,
        fromIndex: oldIndex,
        toIndex: newIndex,
      }

      stateManager.addOperation(operation)
      const result = await stateManager.syncWithAPI(operation)

      if (result.success) {
        stateManager.completeOperation(operation.id)
      } else {
        // ロールバック
        const rolledBack = stateManager.rollbackOperation(reorderedTasks, operation)
        onTaskOrderChange(rolledBack)
        stateManager.setError(result.error || 'タスクの順序変更に失敗しました')
      }
    } catch (error) {
      console.error('Failed to reorder tasks:', error)
      stateManager.setError('タスクの順序変更中にエラーが発生しました')
    }
  }

  const taskIds = tasks.map(task => task.id)

  return (
    <div className="border-t border-gray-200" data-testid="task-list">
      <div className="p-2 bg-gray-50 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">タスク</span>
        <button 
          onClick={onCreateTask}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          data-testid="add-task-button"
        >
          + 追加
        </button>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onEdit={() => onEditTask(task)}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeTask ? (
              <div className="p-2 border-t border-gray-100 bg-white shadow-lg opacity-95">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{activeTask.name}</div>
                    <div className="text-xs text-gray-500">
                      {activeTask.start_date} 〜 {activeTask.end_date}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}