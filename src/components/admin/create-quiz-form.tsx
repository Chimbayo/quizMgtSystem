'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2,
  Save
} from 'lucide-react'
import { QuestionType } from '@/types'

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
})

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
  options: z.array(optionSchema).min(2, 'At least 2 options are required'),
})

const createQuizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().min(1).optional(),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
})

type CreateQuizFormData = z.infer<typeof createQuizSchema>

interface CreateQuizFormProps {
  userId: string
}

export function CreateQuizForm({ userId }: CreateQuizFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuizFormData>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: '',
      description: '',
      passingScore: 60,
      timeLimit: undefined,
      questions: [
        {
          text: '',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
        },
      ],
    },
  })

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  })

  const watchedQuestions = watch('questions')

  const addQuestion = () => {
    appendQuestion({
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    })
  }

  const addOption = (questionIndex: number) => {
    const currentOptions = watchedQuestions[questionIndex]?.options || []
    setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { text: '', isCorrect: false },
    ])
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = watchedQuestions[questionIndex]?.options || []
    if (currentOptions.length > 2) {
      setValue(`questions.${questionIndex}.options`, 
        currentOptions.filter((_, index) => index !== optionIndex)
      )
    }
  }

  const onSubmit = async (data: CreateQuizFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          creatorId: userId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create quiz')
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
              <CardDescription>
                Provide basic information about your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter quiz description (optional)"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%) *</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    {...register('passingScore', { valueAsNumber: true })}
                  />
                  {errors.passingScore && (
                    <p className="text-sm text-destructive">{errors.passingScore.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    placeholder="No time limit"
                    {...register('timeLimit', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Add questions to your quiz
                  </CardDescription>
                </div>
                <Button type="button" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionFields.map((question, questionIndex) => (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Label>Question {questionIndex + 1} *</Label>
                        <Input
                          placeholder="Enter your question"
                          {...register(`questions.${questionIndex}.text`)}
                          className="mt-1"
                        />
                        {errors.questions?.[questionIndex]?.text && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.questions[questionIndex]?.text?.message}
                          </p>
                        )}
                      </div>
                      {questionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="MULTIPLE_CHOICE"
                            {...register(`questions.${questionIndex}.type`)}
                          />
                          <span>Multiple Choice</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="TRUE_FALSE"
                            {...register(`questions.${questionIndex}.type`)}
                          />
                          <span>True/False</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Options</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(questionIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>

                      {watchedQuestions[questionIndex]?.options?.map((_, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Checkbox
                            {...register(`questions.${questionIndex}.options.${optionIndex}.isCorrect`)}
                          />
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                            className="flex-1"
                          />
                          {watchedQuestions[questionIndex]?.options?.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {errors.questions && (
                <p className="text-sm text-destructive">{errors.questions.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
