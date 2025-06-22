import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'
import { initializeLocalDatabase } from '@/lib/db/init'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.displayOrder))

    // フロントエンド形式に変換
    const responseProjects = allProjects.map(project => ({
      id: project.id,
      name: project.name,
      start_date: project.startDate,
      display_order: project.displayOrder,
    }))

    return NextResponse.json(responseProjects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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

    // ローカルデータベース初期化
    await initializeLocalDatabase()

    const body = await request.json()
    const { name, start_date, display_order = 0 } = body

    if (!name || !start_date) {
      return NextResponse.json(
        { error: 'Name and start_date are required' },
        { status: 400 }
      )
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        name,
        startDate: start_date,
        displayOrder: display_order,
      })
      .returning()

    // フロントエンド形式に変換
    const responseProject = {
      id: newProject.id,
      name: newProject.name,
      start_date: newProject.startDate,
      display_order: newProject.displayOrder,
    }

    return NextResponse.json(responseProject, { status: 201 })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}