'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Project } from '../../../shared/types'

interface SortableProjectItemProps {
  project: Project
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
}

export function SortableProjectItem({
  project,
  isSelected,
  onSelect,
  onEdit,
}: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 border border-gray-200 rounded-lg bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
      data-testid="sortable-project-item"
    >
      <div 
        className={`p-3 cursor-pointer hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={onSelect}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-1">
            {/* ドラッグハンドル */}
            <div
              {...attributes}
              {...listeners}
              className="mr-3 p-1 cursor-grab hover:bg-gray-100 rounded"
              onClick={(e) => e.stopPropagation()}
              data-testid="drag-handle"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                className="text-gray-400"
                fill="currentColor"
              >
                <circle cx="3" cy="3" r="1" />
                <circle cx="9" cy="3" r="1" />
                <circle cx="3" cy="9" r="1" />
                <circle cx="9" cy="9" r="1" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{project.name}</h3>
              <span className="text-xs text-gray-500">{project.start_date}</span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            編集
          </button>
        </div>
      </div>
    </div>
  )
}