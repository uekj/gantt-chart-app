import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { initializeLocalDatabase } from '@/lib/db/init'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const taskId = parseInt(params.id)
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // フロントエンド形式に変換
    const responseTask = {
      id: task.id,
      project_id: task.projectId,
      name: task.name,
      start_date: task.startDate,
      end_date: task.endDate,
      display_order: task.displayOrder,
    }

    return NextResponse.json(responseTask)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const taskId = parseInt(params.id)
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, start_date, end_date, display_order } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (start_date !== undefined) updateData.startDate = start_date
    if (end_date !== undefined) updateData.endDate = end_date
    if (display_order !== undefined) updateData.displayOrder = display_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // 日付妥当性チェック
    if (start_date && end_date) {
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // ドラッグ&ドロップ時は過去日付チェックをスキップ
    // nameが更新される場合のみ過去日付をチェック（フォーム編集時）
    if (start_date && name !== undefined) {
      const startDate = new Date(start_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (startDate < today) {
        return NextResponse.json(
          { error: 'Start date cannot be in the past' },
          { status: 400 }
        )
      }
    }

    updateData.updatedAt = new Date().toISOString()

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning()

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // フロントエンド形式に変換
    const responseTask = {
      id: updatedTask.id,
      project_id: updatedTask.projectId,
      name: updatedTask.name,
      start_date: updatedTask.startDate,
      end_date: updatedTask.endDate,
      display_order: updatedTask.displayOrder,
    }

    return NextResponse.json(responseTask)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const taskId = parseInt(params.id)
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const [deletedTask] = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning()

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}