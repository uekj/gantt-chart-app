import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { projects, tasks } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * Retrieves a project by ID for the authenticated user.
 *
 * Returns the project data if it exists and belongs to the user; otherwise, returns an appropriate error response.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)
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

/**
 * Updates a project belonging to the authenticated user with provided fields.
 *
 * Accepts `name`, `start_date`, and `display_order` in the request body to update the specified project. Returns the updated project data if successful, or an error if the project is not found, the user is unauthorized, the project ID is invalid, or no valid fields are provided.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)
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

/**
 * Deletes a project and all its associated tasks for the authenticated user.
 *
 * Returns a success message if the project is deleted, or an error if the project does not exist, does not belong to the user, or if an error occurs.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)
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