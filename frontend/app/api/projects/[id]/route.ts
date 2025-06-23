import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { projects, tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

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

    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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

    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, start_date, display_order } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (start_date !== undefined) updateData.startDate = start_date
    if (display_order !== undefined) updateData.displayOrder = display_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateData.updatedAt = new Date().toISOString()

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .returning()

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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

    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // まず、このユーザーのプロジェクトかどうか確認
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await db.delete(tasks).where(eq(tasks.projectId, projectId))

    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning()

    if (!deletedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}