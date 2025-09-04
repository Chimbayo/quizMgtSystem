import { useState, useEffect } from 'react';
import { authService, quizService } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { QuizDto, QuestionDto } from '@/types';

import { PlusCircle, Edit, Trash2, LogOut } from 'lucide-react';

// Helper to narrow select values
const asQuestionType = (value: string): 'multiple-choice' | 'true-false' =>
  value === 'true-false' ? 'true-false' : 'multiple-choice';

// Types
interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  passingScore: number;
  questions: Array<{ id: number; question: string; type: string; options: string[]; correctAnswer: number; }>; // for taking
  createdBy: number;
  createdAt: Date;
}

const QuizManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([] as any);

  // Authentication
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '', role: 'student' });
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.verifyToken();
        setCurrentUser(response.user);
      } catch (error) {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadQuizzes();
    }
  }, [currentUser]);

  const loadQuizzes = async () => {
    try {
      const quizzesData = await quizService.getQuizzes();
      setQuizzes(quizzesData as any);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const handleLogin = async () => {
    try {
      setLoginError('');
      const response = await authService.login(loginForm.email, loginForm.password);
      setCurrentUser(response.user);
      setLoginForm({ email: '', password: '' });
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      setLoginError('');
      const response = await authService.register(
        registerForm.email,
        registerForm.password,
        registerForm.name,
        registerForm.role
      );
      setCurrentUser(response.user);
      setRegisterForm({ email: '', password: '', name: '', role: 'student' });
      setShowRegister(false);
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setQuizzes([] as any);
  };

  // Quiz Creation/Editing
  const [quizForm, setQuizForm] = useState<QuizDto>({
    title: '',
    description: '',
    passingScore: 60,
    questions: [] as QuestionDto[]
  });
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);

  const [questionForm, setQuestionForm] = useState<QuestionDto>({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const addQuestion = () => {
    if (!questionForm.question.trim()) return;
    const newQuestion: QuestionDto = {
      question: questionForm.question,
      type: questionForm.type,
      options: questionForm.type === 'true-false' ? ['True', 'False'] : questionForm.options.filter(opt => opt.trim()),
      correctAnswer: questionForm.correctAnswer
    };

    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, newQuestion]
    });

    setQuestionForm({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const saveQuiz = async () => {
    if (!currentUser) return;
    if (!quizForm.title.trim() || quizForm.questions.length === 0) return;

    try {
      const quizData: QuizDto = {
        title: quizForm.title,
        description: quizForm.description,
        passingScore: quizForm.passingScore,
        questions: quizForm.questions
      };

      if (editingQuiz) {
        await quizService.updateQuiz(editingQuiz.id, quizData);
      } else {
        await quizService.createQuiz(quizData);
      }

      await loadQuizzes();
    } catch (error: any) {
      console.error('Failed to save quiz:', error.message);
      return;
    }

    resetQuizForm();
  };

  const resetQuizForm = () => {
    setQuizForm({ title: '', description: '', passingScore: 60, questions: [] });
    setEditingQuiz(null);
    setShowQuizDialog(false);
  };

  const editQuiz = (quiz: Quiz) => {
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      passingScore: (quiz as any).passing_score ?? quiz.passingScore,
      questions: [...(quiz as any).questions ?? []]
    } as any);
    setEditingQuiz(quiz);
    setShowQuizDialog(true);
  };

  const deleteQuiz = async (quizId: number) => {
    try {
      await quizService.deleteQuiz(quizId);
      await loadQuizzes();
    } catch (error: any) {
      console.error('Failed to delete quiz:', error.message);
    }
  };

  // Quiz Taking
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correctCount: number; totalQuestions: number } | null>(null);

  const startQuiz = async (quiz: any) => {
    try {
      const detailed = await quizService.getQuiz(quiz.id);
      // Normalize question types to DTO-compatible shape
      if (detailed && detailed.questions) {
        detailed.questions = detailed.questions.map((qq: any, idx: number) => ({
          id: qq.id ?? idx,
          question: qq.question,
          type: (qq.type as 'multiple-choice' | 'true-false') ?? 'multiple-choice',
          options: Array.isArray(qq.options) ? qq.options : (typeof qq.options === 'string' ? JSON.parse(qq.options) : []),
          correctAnswer: qq.correct_answer ?? qq.correctAnswer ?? 0,
        }));
      }
      setTakingQuiz(detailed as any);
      setCurrentAnswers({});
      setQuizResult(null);
    } catch (e) {
      console.error('Failed to load quiz details');
    }
  };

  const submitQuiz = async () => {
    if (!takingQuiz || !currentUser) return;

    try {
      const answersArray = (takingQuiz.questions || []).map((question: any) => currentAnswers[question.id] ?? -1);
      const result = await quizService.submitQuiz(takingQuiz.id, answersArray);
      setQuizResult(result);
      setTakingQuiz(null);
    } catch (error: any) {
      console.error('Failed to submit quiz:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-lg relative z-10">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Quiz Management System</CardTitle>
            <CardDescription className="text-slate-600 mt-2 font-medium">Welcome back! Please sign in to continue</CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <div className="space-y-6">
              {!showRegister ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                    <Input id="email" type="email" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} placeholder="Enter your email" className="h-12 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50 focus:bg-white transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <Input id="password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} placeholder="Enter your password" className="h-12 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50 focus:bg-white transition-all" required />
                  </div>
                  {loginError && (
                    <Alert variant="destructive" className="border-red-300 bg-red-50">
                      <AlertDescription className="text-red-700 font-medium">{loginError}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="button" onClick={handleLogin} className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">Sign In</Button>
                  <div className="text-center">
                    <Button type="button" variant="ghost" onClick={() => setShowRegister(true)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Don't have an account? Register here
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</Label>
                    <Input id="name" type="text" value={registerForm.name} onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})} placeholder="Enter your full name" className="h-12 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50 focus:bg-white transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-slate-700">Role</Label>
                    <Select value={registerForm.role} onValueChange={(value) => setRegisterForm({...registerForm, role: value})}>
                      <SelectTrigger className="h-12 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50 focus:bg-white">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                    <Input id="email" type="email" value={registerForm.email} onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} placeholder="Enter your email" className="h-12 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50 focus:bg-white transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <Input id="password" type="password" value={registerForm.password} onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} placeholder="Enter your password" className="h-12 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50 focus:bg-white transition-all" required />
                  </div>
                  {loginError && (
                    <Alert variant="destructive" className="border-red-300 bg-red-50">
                      <AlertDescription className="text-red-700 font-medium">{loginError}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="button" onClick={handleRegister} className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">Register</Button>
                  <div className="text-center">
                    <Button type="button" variant="ghost" onClick={() => setShowRegister(false)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Already have an account? Sign in here
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm text-slate-600 bg-gradient-to-r from-slate-50 to-slate-100 rounded-b-lg px-8 py-6">
            <div className="w-full space-y-3">
              <p className="font-semibold text-slate-700">Demo Credentials:</p>
              <div className="space-y-2">
                <p className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 rounded-lg border border-emerald-200"><span className="font-semibold text-emerald-600">Admin:</span> <span className="text-slate-700">admin@quiz.com / admin123</span></p>
                <p className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 rounded-lg border border-cyan-200"><span className="font-semibold text-cyan-600">Student:</span> <span className="text-slate-700">student@quiz.com / student123</span></p>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (takingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
              <CardTitle className="text-3xl font-bold">{takingQuiz.title}</CardTitle>
              <CardDescription className="text-emerald-100 text-lg">{takingQuiz.description}</CardDescription>
              <div className="flex items-center justify-between mt-6">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">🎯 Passing Score: {takingQuiz.passingScore}%</Badge>
                <div className="text-sm text-emerald-100 bg-white/10 px-4 py-2 rounded-full">
                  📊 Progress: {Object.keys(currentAnswers).length} / {takingQuiz.questions.length} questions
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-8 bg-gradient-to-b from-white to-slate-50">
              {takingQuiz.questions.map((question, index) => (
                <Card key={question.id} className="p-6 border-l-4 border-l-emerald-400 bg-gradient-to-r from-white via-emerald-50/30 to-cyan-50/30 shadow-lg hover:shadow-xl transition-all duration-200">
                  <h3 className="font-bold mb-6 text-xl text-slate-800">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm mr-4 shadow-md">
                      {index + 1}
                    </span>
                    {question.question}
                  </h3>
                  <RadioGroup
                    value={currentAnswers[question.id]?.toString()}
                    onValueChange={(value) => setCurrentAnswers({
                      ...currentAnswers,
                      [question.id]: parseInt(value)
                    })}
                    className="space-y-4"
                  >
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-4 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 cursor-pointer group">
                        <RadioGroupItem value={optionIndex.toString()} id={`q${question.id}_${optionIndex}`} className="text-emerald-500 border-2 border-slate-300 group-hover:border-emerald-400" />
                        <Label htmlFor={`q${question.id}_${optionIndex}`} className="flex-1 cursor-pointer font-medium text-slate-700 group-hover:text-slate-800">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between bg-gradient-to-r from-slate-50 to-slate-100 p-6">
              <Button variant="outline" onClick={() => setTakingQuiz(null)} className="border-slate-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50 px-6">
                ❌ Cancel Quiz
              </Button>
              <Button 
                onClick={submitQuiz}
                disabled={Object.keys(currentAnswers).length !== takingQuiz.questions.length}
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 disabled:from-slate-400 disabled:to-slate-500 px-8 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                ✅ Submit Quiz ({Object.keys(currentAnswers).length}/{takingQuiz.questions.length})
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        </div>
        <Card className="w-full max-w-lg text-center shadow-2xl border-0 relative z-10">
          <CardHeader className={`${quizResult.passed ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' : 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-500'} text-white py-10`}>
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-white/20 backdrop-blur-sm">
              {quizResult.passed ? (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <CardTitle className="text-4xl font-bold">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 py-10">
            <div className={`text-8xl font-black ${quizResult.passed ? 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent'}`}>
              {quizResult.score}%
            </div>
            <Badge variant={quizResult.passed ? "default" : "destructive"} className={`text-2xl px-8 py-4 font-bold ${quizResult.passed ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : ''}`}>
              {quizResult.passed ? '🎉 CONGRATULATIONS!' : '💪 TRY AGAIN!'}
            </Badge>
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
              <p className="text-slate-700 text-xl font-semibold">
                You answered <span className="text-emerald-600 font-bold text-2xl">{quizResult.correctCount}</span> out of <span className="text-cyan-600 font-bold text-2xl">{quizResult.totalQuestions}</span> questions correctly.
              </p>
              {quizResult.passed ? (
                <p className="text-emerald-600 mt-4 text-lg font-medium">
                  Excellent work! You've mastered this topic! 🌟
                </p>
              ) : (
                <p className="text-slate-600 mt-4 text-lg">
                  Keep studying and try again! You're getting closer! 💪
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 p-8">
            <Button onClick={() => setQuizResult(null)} className="w-full h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              🏠 Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Quiz Management System</h1>
                <p className="text-sm text-slate-600 flex items-center mt-1">
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                  Welcome, <span className="font-semibold text-slate-800 ml-1">{currentUser?.name}</span> 
                  <Badge variant="secondary" className="ml-2 text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200">{currentUser?.role}</Badge>
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="border-slate-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser?.role === 'admin' ? (
          <Tabs defaultValue="quizzes" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-2 border border-slate-200">
              <TabsTrigger value="quizzes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-semibold rounded-xl transition-all duration-200 data-[state=active]:shadow-lg">📚 Manage Quizzes</TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-semibold rounded-xl transition-all duration-200 data-[state=active]:shadow-lg">📊 View Results</TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-semibold rounded-xl transition-all duration-200 data-[state=active]:shadow-lg">👥 Students</TabsTrigger>
            </TabsList>

            <TabsContent value="quizzes" className="space-y-6">
              <div className="flex justify-between items-center bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Quiz Management</h2>
                  <p className="text-slate-600 mt-2 text-lg">Create and manage your quizzes with ease</p>
                </div>
                <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 px-6 py-3">
                      <PlusCircle className="w-5 h-5 mr-2" />
                      ✨ Create New Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input id="title" value={quizForm.title} onChange={(e) => setQuizForm({...quizForm, title: e.target.value})} placeholder="Enter quiz title" />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={quizForm.description} onChange={(e) => setQuizForm({...quizForm, description: e.target.value})} placeholder="Enter quiz description" />
                      </div>
                      <div>
                        <Label htmlFor="passingScore">Passing Score (%)</Label>
                        <Input id="passingScore" type="number" min="1" max="100" value={quizForm.passingScore} onChange={(e) => setQuizForm({...quizForm, passingScore: parseInt(e.target.value)})} />
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Add Question</h3>
                        <div className="space-y-3">
                          <Input value={questionForm.question} onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})} placeholder="Enter question" />
                          <Select value={questionForm.type} onValueChange={(value) => setQuestionForm({...questionForm, type: asQuestionType(value), correctAnswer: 0})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                              <SelectItem value="true-false">True/False</SelectItem>
                            </SelectContent>
                          </Select>

                          {questionForm.type === 'multiple-choice' && (
                            <div className="space-y-2">
                              {questionForm.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Checkbox checked={questionForm.correctAnswer === index} onCheckedChange={(checked) => { if (checked) setQuestionForm({...questionForm, correctAnswer: index}); }} />
                                  <Input value={option} onChange={(e) => { const newOptions = [...questionForm.options]; newOptions[index] = e.target.value; setQuestionForm({...questionForm, options: newOptions}); }} placeholder={`Option ${index + 1}`} />
                                </div>
                              ))}
                            </div>
                          )}

                          {questionForm.type === 'true-false' && (
                            <RadioGroup value={questionForm.correctAnswer.toString()} onValueChange={(value) => setQuestionForm({...questionForm, correctAnswer: parseInt(value)})}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="0" id="true" />
                                <Label htmlFor="true">True</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="false" />
                                <Label htmlFor="false">False</Label>
                              </div>
                            </RadioGroup>
                          )}

                          <Button type="button" onClick={addQuestion} variant="outline">Add Question</Button>
                        </div>
                      </div>

                      {quizForm.questions.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">Questions ({quizForm.questions.length})</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {quizForm.questions.map((q, index) => (
                              <Card key={q.id ?? index} className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{index + 1}. {q.question}</p>
                                    <p className="text-sm text-gray-600">Correct Answer: {q.options[q.correctAnswer]}</p>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => setQuizForm({ ...quizForm, questions: quizForm.questions.filter((question, i) => (q.id ?? i) !== (question.id ?? i)) })}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetQuizForm}>Cancel</Button>
                      <Button onClick={saveQuiz} disabled={!quizForm.title.trim() || quizForm.questions.length === 0}>{editingQuiz ? 'Update Quiz' : 'Create Quiz'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6">
                {quizzes
                  .filter((q: any) => q.created_by ? q.created_by === currentUser.id : q.createdBy === currentUser.id)
                  .map((quiz: any) => (
                  <Card key={quiz.id} className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-slate-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-slate-800 mb-2 font-bold">{quiz.title}</CardTitle>
                          <CardDescription className="text-slate-600 text-base">{quiz.description}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => editQuiz(quiz)} className="hover:bg-emerald-100 hover:text-emerald-700 rounded-xl">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteQuiz(quiz.id)} className="hover:bg-red-100 hover:text-red-700 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl p-4 text-center shadow-md">
                          <div className="text-2xl font-bold text-emerald-700">{quiz.question_count ?? quiz.questions?.length ?? 0}</div>
                          <div className="text-xs text-emerald-600 font-semibold mt-1">Questions</div>
                        </div>
                        <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl p-4 text-center shadow-md">
                          <div className="text-2xl font-bold text-teal-700">{quiz.passing_score ?? quiz.passingScore}%</div>
                          <div className="text-xs text-teal-600 font-semibold mt-1">Passing Score</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="results">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="text-2xl text-gray-800">📊 Quiz Results</CardTitle>
                  <CardDescription>View quiz attempts by students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-500">Select a quiz to view attempts in a future iteration.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="text-2xl text-gray-800">👥 Students</CardTitle>
                  <CardDescription>View student performance and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-500">Student listing powered by API can be added later.</div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="available" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-2 border border-slate-200">
              <TabsTrigger value="available" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-semibold rounded-xl transition-all duration-200 data-[state=active]:shadow-lg">🎯 Available Quizzes</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-semibold rounded-xl transition-all duration-200 data-[state=active]:shadow-lg">📈 My History</TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">Available Quizzes</h2>
                  <p className="text-slate-600 text-lg">Test your knowledge with these exciting quizzes</p>
                </div>
                <div className="grid gap-6">
                  {quizzes.map((quiz: any) => (
                    <Card key={quiz.id} className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-slate-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-2xl text-slate-800 mb-2 font-bold">{quiz.title}</CardTitle>
                            <CardDescription className="text-slate-600 text-base">{quiz.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl p-4 text-center shadow-md">
                              <div className="text-xl font-bold text-emerald-700">{quiz.questions?.length ?? quiz.question_count ?? 0}</div>
                              <div className="text-xs text-emerald-600 font-semibold mt-1">Questions</div>
                            </div>
                            <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl p-4 text-center shadow-md">
                              <div className="text-xl font-bold text-teal-700">{quiz.passing_score ?? quiz.passingScore}%</div>
                              <div className="text-xs text-teal-600 font-semibold mt-1">To Pass</div>
                            </div>
                            <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl p-4 text-center shadow-md">
                              <div className="text-xl font-bold text-cyan-700">—</div>
                              <div className="text-xs text-cyan-600 font-semibold mt-1">Attempts</div>
                            </div>
                          </div>
                          <Button onClick={() => startQuiz(quiz)} className="ml-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 px-8 py-3 text-lg font-semibold">
                            🚀 Start Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="text-2xl text-gray-800">📈 Quiz History</CardTitle>
                  <CardDescription>Track your quiz performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-500">Fetching attempts from API can be added later.</div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default QuizManagementSystem;
