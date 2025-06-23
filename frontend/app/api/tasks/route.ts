import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { tasks, projects } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq, desc, and } from 'drizzle-orm'
import { initializeLocalDatabase } from '@/lib/db/init'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    // ユーザーのプロジェクトのタスクのみ取得
    let query = db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        name: tasks.name,
        startDate: tasks.startDate,
        endDate: tasks.endDate,
        displayOrder: tasks.displayOrder,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, session.user.id))

    if (projectId) {
      const projectIdNum = parseInt(projectId)
      if (isNaN(projectIdNum)) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
      }
      query = query.where(and(eq(projects.userId, session.user.id), eq(tasks.projectId, projectIdNum)))
    }

    const allTasks = await query.orderBy(desc(tasks.displayOrder))
    
    // フロントエンド形式に変換
    const responseTasks = allTasks.map(task => ({
      id: task.id,
      project_id: task.projectId,
      name: task.name,
      start_date: task.startDate,
      end_date: task.endDate,
      display_order: task.displayOrder,
    }))
    
    return NextResponse.json(responseTasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, name, start_date, end_date, display_order = 0 } = body

    if (!project_id || !name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'project_id, name, start_date, and end_date are required' },
        { status: 400 }
      )
    }

    // プロジェクトがユーザーのものかチェック
    const projectExists = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, project_id), eq(projects.userId, session.user.id)))
    
    if (projectExists.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // 過去日付制限は削除済み

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const [newTask] = await db
      .insert(tasks)
      .values({
        projectId: project_id,
        name,
        startDate: start_date,
        endDate: end_date,
        displayOrder: display_order,
      })
      .returning()

    // フロントエンド形式に変換
    const responseTask = {
      id: newTask.id,
      project_id: newTask.projectId,
      name: newTask.name,
      start_date: newTask.startDate,
      end_date: newTask.endDate,
      display_order: newTask.displayOrder,
    }

    return NextResponse.json(responseTask, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}