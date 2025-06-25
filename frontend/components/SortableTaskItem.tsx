'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../../shared/types'

interface SortableTaskItemProps {
  task: Task
  onEdit: () => void
}

export function SortableTaskItem({
  task,
  onEdit,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onEdit}
      data-testid="sortable-task-item"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start flex-1">
          {/* ドラッグハンドル */}
          <div
            {...attributes}
            {...listeners}
            className="mr-2 mt-1 p-1 cursor-grab hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
            data-testid="drag-handle"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="text-gray-400"
              fill="currentColor"
            >
              <circle cx="2" cy="2" r="0.8" />
              <circle cx="8" cy="2" r="0.8" />
              <circle cx="2" cy="8" r="0.8" />
              <circle cx="8" cy="8" r="0.8" />
            </svg>
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800" data-testid="task-name">{task.name}</div>
            <div className="text-xs text-gray-500">
              {task.start_date} 〜 {task.end_date}
            </div>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="ml-2 px-1 py-1 text-xs text-gray-400 hover:text-gray-600"
        >
          ✏️
        </button>
      </div>
    </div>
  )
}