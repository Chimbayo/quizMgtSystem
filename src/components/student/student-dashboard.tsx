'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Clock, 
  Users, 
  TrendingUp,
  Play,
  History,
  LogOut,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'
import { Quiz, QuizAttempt } from '@prisma/client'

interface QuizWithCounts extends Quiz {
  creator: {
    name: string
  }
  _count: {
    questions: number
    attempts: number
  }
}

interface AttemptWithQuiz extends QuizAttempt {
  quiz: {
    title: string
    passingScore: number
  }
}

interface StudentDashboardProps {
  user: SessionUser
  quizzes: QuizWithCounts[]
  attempts: AttemptWithQuiz[]
}

export function StudentDashboard({ user, quizzes, attempts }: StudentDashboardProps) {
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

  const handleStartQuiz = (quizId: string) => {
    router.push(`/student/quiz/${quizId}`)
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return 'text-green-600'
    }
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return 'default' as const
    }
    return 'destructive' as const
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
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
              <CardTitle className="text-sm font-medium">Available Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Attempted</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attempts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attempts.length > 0 
                  ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Quizzes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Available Quizzes</h2>
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes available</h3>
                <p className="text-gray-600">
                  Check back later for new quizzes
                </p>
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
                        <p className="text-sm text-gray-600 mt-2">
                          Created by {quiz.creator.name}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleStartQuiz(quiz.id)}
                        disabled={!quiz.isActive}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Quiz
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Questions:</span>
                        <span className="ml-2 font-medium">{quiz._count.questions}</span>
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
                      <div>
                        <span className="text-gray-600">Total Attempts:</span>
                        <span className="ml-2 font-medium">{quiz._count.attempts}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quiz History */}
        {attempts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Quiz History</h2>
            <div className="grid gap-4">
              {attempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {attempt.passed ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{attempt.quiz.title}</h3>
                          <p className="text-sm text-gray-600">
                            Completed on {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(attempt.score, attempt.quiz.passingScore)}`}>
                            {attempt.score}%
                          </div>
                          <Badge variant={getScoreBadgeVariant(attempt.score, attempt.quiz.passingScore)}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/student/quiz/${attempt.quizId}/results`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
