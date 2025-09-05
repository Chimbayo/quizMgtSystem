'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  BarChart3, 
  BookOpen, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  LogOut
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'
import { Quiz } from '@prisma/client'

interface QuizWithCounts extends Quiz {
  _count: {
    questions: number
    attempts: number
  }
}

interface AdminDashboardProps {
  user: SessionUser
  quizzes: QuizWithCounts[]
  stats: {
    totalQuizzes: number
    totalAttempts: number
    averageScore: number
  }
}

export function AdminDashboard({ user, quizzes, stats }: AdminDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete quiz')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete quiz')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.averageScore)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Quizzes</h2>
          <Button onClick={() => router.push('/admin/quizzes/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Quiz
          </Button>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first quiz to get started
              </p>
              <Button onClick={() => router.push('/admin/quizzes/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {quiz.title}
                        {!quiz.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {quiz.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/quizzes/${quiz.id}/results`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/quizzes/${quiz.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Questions:</span>
                      <span className="ml-2 font-medium">{quiz._count.questions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Attempts:</span>
                      <span className="ml-2 font-medium">{quiz._count.attempts}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Passing Score:</span>
                      <span className="ml-2 font-medium">{quiz.passingScore}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="ml-2 font-medium">
                        {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
