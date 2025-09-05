'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { QuizWithQuestions, QuestionType } from '@/types'

interface QuizInterfaceProps {
  quiz: QuizWithQuestions
  userId: string
}

interface Answer {
  questionId: string
  selectedOptionIds: string[]
}

export function QuizInterface({ quiz, userId }: QuizInterfaceProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startTime] = useState(Date.now())

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  // Initialize answers array
  useEffect(() => {
    const initialAnswers = quiz.questions.map(question => ({
      questionId: question.id,
      selectedOptionIds: [],
    }))
    setAnswers(initialAnswers)
  }, [quiz.questions])

  // Timer setup
  useEffect(() => {
    if (quiz.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60) // Convert minutes to seconds
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quiz.timeLimit])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (optionId: string, isChecked: boolean) => {
    setAnswers(prev => {
      const newAnswers = [...prev]
      const currentAnswer = newAnswers[currentQuestionIndex]
      
      if (currentQuestion.type === 'MULTIPLE_CHOICE') {
        // For multiple choice, only one option can be selected
        currentAnswer.selectedOptionIds = isChecked ? [optionId] : []
      } else {
        // For true/false, toggle the option
        if (isChecked) {
          currentAnswer.selectedOptionIds = [optionId]
        } else {
          currentAnswer.selectedOptionIds = []
        }
      }
      
      return newAnswers
    })
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          userId,
          answers,
          timeSpent,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit quiz')
      }

      router.push(`/student/quiz/${quiz.id}/results`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentAnswer = () => {
    return answers[currentQuestionIndex]?.selectedOptionIds || []
  }

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  }

  const getAnsweredCount = () => {
    return answers.filter(answer => answer.selectedOptionIds.length > 0).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {timeRemaining !== null && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className={timeRemaining < 300 ? 'text-red-600 font-medium' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                {getAnsweredCount()}/{quiz.questions.length} answered
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestion.text}
            </CardTitle>
            <CardDescription>
              {currentQuestion.type === 'MULTIPLE_CHOICE' 
                ? 'Select the correct answer'
                : 'Select True or False'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
              <RadioGroup
                value={getCurrentAnswer()[0] || ''}
                onValueChange={(value) => handleAnswerChange(value, true)}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={getCurrentAnswer().includes(option.id)}
                      onCheckedChange={(checked) => handleAnswerChange(option.id, !!checked)}
                    />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-4">
            {isLastQuestion ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || getAnsweredCount() === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Quiz Info */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Questions:</span>
                <span className="ml-2 font-medium">{quiz.questions.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Passing Score:</span>
                <span className="ml-2 font-medium">{quiz.passingScore}%</span>
              </div>
              <div>
                <span className="text-gray-600">Time Limit:</span>
                <span className="ml-2 font-medium">
                  {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Created by:</span>
                <span className="ml-2 font-medium">{quiz.creator.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
