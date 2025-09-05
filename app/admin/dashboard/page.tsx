import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { UserRole } from '@/types'

export default async function AdminDashboardPage() {
  try {
    const session = await requireRole('ADMIN')
    
    const quizzes = await prisma.quiz.findMany({
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

    const totalAttempts = await prisma.quizAttempt.count({
      where: {
        quiz: {
          creatorId: session.id,
        },
      },
    })

    const averageScore = await prisma.quizAttempt.aggregate({
      where: {
        quiz: {
          creatorId: session.id,
        },
      },
      _avg: {
        score: true,
      },
    })

    return (
      <AdminDashboard
        user={session}
        quizzes={quizzes}
        stats={{
          totalQuizzes: quizzes.length,
          totalAttempts,
          averageScore: averageScore._avg.score || 0,
        }}
      />
    )
  } catch (error) {
    redirect('/admin')
  }
}
