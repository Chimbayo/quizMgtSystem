import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole } from '@/types'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Get quiz details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')
    
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id, // Ensure admin can only access their own quizzes
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update quiz
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')
    const body = await request.json()

    const updateQuizSchema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      passingScore: z.number().min(0).max(100).optional(),
      timeLimit: z.number().min(1).optional(),
      isActive: z.boolean().optional(),
    })

    const data = updateQuizSchema.parse(body)

    // Check if quiz exists and belongs to the admin
    const existingQuiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id,
      },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data,
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error('Update quiz error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')

    // Check if quiz exists and belongs to the admin
    const existingQuiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id,
      },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Delete the quiz (cascade will handle related records)
    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
