import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole, QuestionType } from '@/types'

const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().min(1).optional(),
  creatorId: z.string(),
  questions: z.array(z.object({
    text: z.string().min(1),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
    })).min(2),
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const body = await request.json()
    const data = createQuizSchema.parse(body)

    // Verify the creator is the authenticated user
    if (data.creatorId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        passingScore: data.passingScore,
        timeLimit: data.timeLimit,
        creatorId: data.creatorId,
        questions: {
          create: data.questions.map((question, index) => ({
            text: question.text,
            type: question.type,
            order: index + 1,
            options: {
              create: question.options.map((option, optionIndex) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: optionIndex + 1,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Create quiz error:', error)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let quizzes

    if (role === 'student') {
      // Get all active quizzes for students
      quizzes = await prisma.quiz.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: { name: true },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Get quizzes for admin (requires authentication)
      const session = await requireRole('ADMIN')
      quizzes = await prisma.quiz.findMany({
        where: { creatorId: session.id },
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
