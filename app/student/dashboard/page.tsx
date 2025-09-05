import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StudentDashboard } from '@/components/student/student-dashboard'
import { UserRole } from '@/types'

export default async function StudentDashboardPage() {
  try {
    const session = await requireRole('STUDENT')
    
    const quizzes = await prisma.quiz.findMany({
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

    const userAttempts = await prisma.quizAttempt.findMany({
      where: { userId: session.id },
      include: {
        quiz: {
          select: {
            title: true,
            passingScore: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return (
      <StudentDashboard
        user={session}
        quizzes={quizzes}
        attempts={userAttempts}
      />
    )
  } catch (error) {
    redirect('/student')
  }
}
