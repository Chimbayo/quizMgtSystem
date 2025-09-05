import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizInterface } from '@/components/student/quiz-interface'
import { UserRole } from '@/types'

interface QuizPageProps {
  params: {
    id: string
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  try {
    const session = await requireRole('STUDENT')
    
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        isActive: true,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        creator: {
          select: { name: true },
        },
      },
    })

    if (!quiz) {
      redirect('/student/dashboard')
    }

    // Check if user has already attempted this quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId: params.id,
        completedAt: { not: null },
      },
    })

    if (existingAttempt) {
      redirect(`/student/quiz/${params.id}/results`)
    }

    return (
      <QuizInterface
        quiz={quiz}
        userId={session.id}
      />
    )
  } catch (error) {
    redirect('/student')
  }
}
