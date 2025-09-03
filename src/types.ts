export type Role = 'admin' | 'student';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface QuestionDto {
  id?: number;
  question: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: number;
}

export interface QuizDto {
  title: string;
  description?: string;
  passingScore: number;
  questions: QuestionDto[];
}

export interface QuizAttemptResultDto {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
}


