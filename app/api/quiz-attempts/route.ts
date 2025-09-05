import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole } from '@/types'

const submitQuizSchema = z.object({
  quizId: z.string(),
  userId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptionIds: z.array(z.string()),
  })),
  timeSpent: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT')
    const body = await request.json()
    const data = submitQuizSchema.parse(body)

    // Verify the user is the authenticated user
    if (data.userId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get the quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: data.quizId,
        isActive: true,
      },
      include: {
        questions: {
          include: {
            options: true,
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

    // Check if user has already completed this quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: data.userId,
        quizId: data.quizId,
        completedAt: { not: null },
      },
    })

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'Quiz already completed' },
        { status: 400 }
      )
    }

    // Calculate score
    let correctAnswers = 0
    const totalQuestions = quiz.questions.length

    for (const answer of data.answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId)
      if (!question) continue

      const correctOptionIds = question.options
        .filter(option => option.isCorrect)
        .map(option => option.id)
        .sort()

      const selectedOptionIds = answer.selectedOptionIds.sort()

      // Check if the selected options match the correct options exactly
      if (JSON.stringify(selectedOptionIds) === JSON.stringify(correctOptionIds)) {
        correctAnswers++
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = score >= quiz.passingScore

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: data.userId,
        quizId: data.quizId,
        score,
        passed,
        timeSpent: data.timeSpent,
        completedAt: new Date(),
        answers: {
          create: data.answers.map(answer => {
            const question = quiz.questions.find(q => q.id === answer.questionId)
            const correctOptionIds = question?.options
              .filter(option => option.isCorrect)
              .map(option => option.id)
              .sort() || []
            const selectedOptionIds = answer.selectedOptionIds.sort()
            const isCorrect = JSON.stringify(selectedOptionIds) === JSON.stringify(correctOptionIds)

            return {
              questionId: answer.questionId,
              selectedOptionId: answer.selectedOptionIds[0] || null,
              isCorrect,
            }
          }),
        },
      },
      include: {
        quiz: {
          select: {
            title: true,
            passingScore: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('Submit quiz error:', error)
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
