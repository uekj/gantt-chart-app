'use client'

import { createContext, useContext, ReactNode } from 'react'
import { DragDropStateManager } from '@/lib/drag-drop/state-manager'

interface DragDropContextType {
  stateManager: DragDropStateManager
}

const DragDropContext = createContext<DragDropContextType | null>(null)

export function DragDropProvider({ children }: { children: ReactNode }) {
  const stateManager = new DragDropStateManager()

  return (
    <DragDropContext.Provider value={{ stateManager }}>
      {children}
    </DragDropContext.Provider>
  )
}

export function useDragDropState() {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDropState must be used within DragDropProvider')
  }
  return context.stateManager
}