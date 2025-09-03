export interface JwtUserPayload {
  userId: number;
  email: string;
  role: 'admin' | 'student';
}

export interface CreateQuestionDto {
  question: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: number;
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  passingScore: number;
  questions: CreateQuestionDto[];
}

export interface QuizAttemptResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
}


