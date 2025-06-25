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
import { Project } from '../../../shared/types'
import { SortableProjectItem } from './SortableProjectItem'
import { useDragDropState } from './DragDropProvider'

interface SortableProjectListProps {
  projects: Project[]
  selectedProject: number | null
  onProjectSelect: (projectId: number | null) => void
  onEditProject: (project: Project) => void
  onCreateProject: () => void
  onProjectOrderChange: (reorderedProjects: Project[]) => void
}

export function SortableProjectList({
  projects,
  selectedProject,
  onProjectSelect,
  onEditProject,
  onCreateProject,
  onProjectOrderChange,
}: SortableProjectListProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
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
    const project = projects.find(p => p.id === active.id)
    if (project) {
      setActiveProject(project)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = projects.findIndex(p => p.id === active.id)
    const newIndex = projects.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    try {
      // 楽観的更新
      const reorderedProjects = stateManager.optimisticReorderProjects(
        projects,
        oldIndex,
        newIndex
      )
      onProjectOrderChange(reorderedProjects)

      // API同期
      const movingProject = projects[oldIndex]
      const newOrder = reorderedProjects[newIndex].display_order
      
      const operation = {
        id: `project-${Date.now()}`,
        type: 'project' as const,
        itemId: movingProject.id,
        oldOrder: movingProject.display_order,
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
        const rolledBack = stateManager.rollbackOperation(reorderedProjects, operation)
        onProjectOrderChange(rolledBack)
        stateManager.setError(result.error || 'プロジェクトの順序変更に失敗しました')
      }
    } catch (error) {
      console.error('Failed to reorder projects:', error)
      stateManager.setError('プロジェクトの順序変更中にエラーが発生しました')
    }
  }

  const projectIds = projects.map(project => project.id)

  return (
    <div className="p-4" data-testid="project-list">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">プロジェクト</h2>
        <button 
          onClick={onCreateProject}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          data-testid="create-project-button"
        >
          + 新規
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
          {projects.map(project => (
            <SortableProjectItem
              key={project.id}
              project={project}
              isSelected={selectedProject === project.id}
              onSelect={() => onProjectSelect(
                selectedProject === project.id ? null : project.id
              )}
              onEdit={() => onEditProject(project)}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeProject ? (
            <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-lg opacity-95" data-testid="drag-overlay">
              <div className="p-3 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{activeProject.name}</h3>
                    <span className="text-xs text-gray-500">{activeProject.start_date}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}