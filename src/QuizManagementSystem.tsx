import { useState } from 'react';
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

import { PlusCircle, Edit, Trash2, LogOut } from 'lucide-react';

// Types
interface User {
  id: number;
  email: string;
  password: string;
  role: string;
  name: string;
}

interface Question {
  id: number;
  question: string;
  type: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  passingScore: number;
  questions: Question[];
  createdBy: number;
  createdAt: Date;
}

// Mock data and state management
const QuizManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const users = [
    { id: 1, email: 'admin@quiz.com', password: 'admin123', role: 'admin', name: 'Admin User' },
    { id: 2, email: 'student@quiz.com', password: 'student123', role: 'student', name: 'John Student' },
    { id: 3, email: 'jane@quiz.com', password: 'student123', role: 'student', name: 'Jane Doe' }
  ];
  
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      description: 'Test your knowledge of JavaScript basics',
      passingScore: 70,
      questions: [
        {
          id: 1,
          question: 'What is the correct way to declare a variable in JavaScript?',
          type: 'multiple-choice',
          options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
          correctAnswer: 0
        },
        {
          id: 2,
          question: 'JavaScript is a statically typed language.',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 1
        }
      ],
      createdBy: 1,
      createdAt: new Date('2024-01-15')
    }
  ]);
  
  const [attempts, setAttempts] = useState([
    {
      id: 1,
      studentId: 2,
      quizId: 1,
      answers: [0, 1],
      score: 100,
      passed: true,
      attemptedAt: new Date('2024-01-20')
    }
  ]);

  // Authentication
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
      setLoginForm({ email: '', password: '' });
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Quiz Creation/Editing
  const [quizForm, setQuizForm] = useState<{
    title: string;
    description: string;
    passingScore: number;
    questions: Question[];
  }>({
    title: '',
    description: '',
    passingScore: 60,
    questions: []
  });
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);

  const [questionForm, setQuestionForm] = useState({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const addQuestion = () => {
    if (!questionForm.question.trim()) return;
    
    const newQuestion = {
      id: Date.now(),
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

  const saveQuiz = () => {
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }
    
    if (!quizForm.title.trim() || quizForm.questions.length === 0) return;
    
    const quiz = {
      id: editingQuiz ? editingQuiz.id : Date.now(),
      title: quizForm.title,
      description: quizForm.description,
      passingScore: quizForm.passingScore,
      questions: quizForm.questions,
      createdBy: currentUser.id,
      createdAt: editingQuiz ? editingQuiz.createdAt : new Date()
    };
    
    if (editingQuiz) {
      setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? quiz : q));
    } else {
      setQuizzes([...quizzes, quiz]);
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
      passingScore: quiz.passingScore,
      questions: [...quiz.questions]
    });
    setEditingQuiz(quiz);
    setShowQuizDialog(true);
  };

  const deleteQuiz = (quizId: number) => {
    setQuizzes(quizzes.filter(q => q.id !== quizId));
    setAttempts(attempts.filter(a => a.quizId !== quizId));
  };

  // Quiz Taking
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correctCount: number; totalQuestions: number } | null>(null);

  const startQuiz = (quiz: Quiz) => {
    setTakingQuiz(quiz);
    setCurrentAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = () => {
    if (!takingQuiz || !currentUser) return;
    
    const quiz = quizzes.find(q => q.id === takingQuiz.id);
    if (!quiz) return;
    
    let correctCount = 0;
    quiz.questions.forEach(question => {
      const userAnswer = currentAnswers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    
    const attempt = {
      id: Date.now(),
      studentId: currentUser.id,
      quizId: quiz.id,
      answers: quiz.questions.map(q => currentAnswers[q.id] || -1),
      score,
      passed,
      attemptedAt: new Date()
    };
    
    setAttempts([...attempts, attempt]);
    setQuizResult({ score, passed, correctCount, totalQuestions: quiz.questions.length });
    setTakingQuiz(null);
  };

  // Statistics
  const getQuizStats = (quizId: number) => {
    const quizAttempts = attempts.filter(a => a.quizId === quizId);
    const passedAttempts = quizAttempts.filter(a => a.passed);
    return {
      totalAttempts: quizAttempts.length,
      passedAttempts: passedAttempts.length,
      averageScore: quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length) : 0
    };
  };

  const getUserAttempts = (userId: string) => {
    return attempts.filter(a => a.studentId === Number(userId)).map(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      return { ...attempt, quizTitle: quiz?.title || 'Deleted Quiz' };
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Quiz Management System</CardTitle>
            <CardDescription>Sign in to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button type="button" onClick={handleLogin} className="w-full">Sign In</Button>
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm text-gray-600">
            <div className="w-full">
              <p className="mb-2">Demo Credentials:</p>
              <p><strong>Admin:</strong> admin@quiz.com / admin123</p>
              <p><strong>Student:</strong> student@quiz.com / student123</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (takingQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{takingQuiz.title}</CardTitle>
              <CardDescription>{takingQuiz.description}</CardDescription>
              <Badge variant="secondary">Passing Score: {takingQuiz.passingScore}%</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {takingQuiz.questions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <h3 className="font-semibold mb-3">
                    {index + 1}. {question.question}
                  </h3>
                  <RadioGroup
                    value={currentAnswers[question.id]?.toString()}
                    onValueChange={(value) => setCurrentAnswers({
                      ...currentAnswers,
                      [question.id]: parseInt(value)
                    })}
                  >
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={optionIndex.toString()} id={`q${question.id}_${optionIndex}`} />
                        <Label htmlFor={`q${question.id}_${optionIndex}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setTakingQuiz(null)}>Cancel</Button>
              <Button 
                onClick={submitQuiz}
                disabled={Object.keys(currentAnswers).length !== takingQuiz.questions.length}
              >
                Submit Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (quizResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-6xl font-bold ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>
              {quizResult.score}%
            </div>
            <Badge variant={quizResult.passed ? "default" : "destructive"} className="text-lg px-4 py-2">
              {quizResult.passed ? 'PASSED' : 'FAILED'}
            </Badge>
            <p className="text-gray-600">
              You got {quizResult.correctCount} out of {quizResult.totalQuestions} questions correct.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setQuizResult(null)} className="w-full">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Management System</h1>
              <p className="text-sm text-gray-600">
                Welcome, {currentUser.name} ({currentUser.role})
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'admin' ? (
          // Admin Dashboard
          <Tabs defaultValue="quizzes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="quizzes">Manage Quizzes</TabsTrigger>
              <TabsTrigger value="results">View Results</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>

            <TabsContent value="quizzes" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Quiz Management</h2>
                <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                          id="title"
                          value={quizForm.title}
                          onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                          placeholder="Enter quiz title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={quizForm.description}
                          onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                          placeholder="Enter quiz description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passingScore">Passing Score (%)</Label>
                        <Input
                          id="passingScore"
                          type="number"
                          min="1"
                          max="100"
                          value={quizForm.passingScore}
                          onChange={(e) => setQuizForm({...quizForm, passingScore: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Add Question</h3>
                        <div className="space-y-3">
                          <Input
                            value={questionForm.question}
                            onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                            placeholder="Enter question"
                          />
                          <Select value={questionForm.type} onValueChange={(value) => setQuestionForm({...questionForm, type: value, correctAnswer: 0})}>
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
                                  <Checkbox
                                    checked={questionForm.correctAnswer === index}
                                    onCheckedChange={(checked) => {
                                      if (checked) setQuestionForm({...questionForm, correctAnswer: index});
                                    }}
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...questionForm.options];
                                      newOptions[index] = e.target.value;
                                      setQuestionForm({...questionForm, options: newOptions});
                                    }}
                                    placeholder={`Option ${index + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {questionForm.type === 'true-false' && (
                            <RadioGroup
                              value={questionForm.correctAnswer.toString()}
                              onValueChange={(value) => setQuestionForm({...questionForm, correctAnswer: parseInt(value)})}
                            >
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
                          
                          <Button type="button" onClick={addQuestion} variant="outline">
                            Add Question
                          </Button>
                        </div>
                      </div>
                      
                      {quizForm.questions.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">Questions ({quizForm.questions.length})</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {quizForm.questions.map((q, index) => (
                              <Card key={q.id} className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{index + 1}. {q.question}</p>
                                    <p className="text-sm text-gray-600">
                                      Correct Answer: {q.options[q.correctAnswer]}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setQuizForm({
                                      ...quizForm,
                                      questions: quizForm.questions.filter(question => question.id !== q.id)
                                    })}
                                  >
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
                      <Button onClick={saveQuiz} disabled={!quizForm.title.trim() || quizForm.questions.length === 0}>
                        {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6">
                {quizzes.filter(q => q.createdBy === currentUser.id).map(quiz => {
                  const stats = getQuizStats(quiz.id);
                  return (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{quiz.title}</CardTitle>
                            <CardDescription>{quiz.description}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editQuiz(quiz)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteQuiz(quiz.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>{quiz.questions.length} questions</span>
                          <span>Passing: {quiz.passingScore}%</span>
                          <span>{stats.totalAttempts} attempts</span>
                          <span>{stats.passedAttempts} passed</span>
                          {stats.totalAttempts > 0 && <span>Avg: {stats.averageScore}%</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                        <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
                          <div className="grid grid-cols-5 gap-4">
                            <span>Student</span>
                            <span>Quiz</span>
                            <span>Score</span>
                            <span>Result</span>
                            <span>Date</span>
                          </div>
                        </div>
                        {attempts.map(attempt => {
                          const student = users.find(u => u.id === attempt.studentId);
                          const quiz = quizzes.find(q => q.id === attempt.quizId);
                          return (
                            <div key={attempt.id} className="border-b px-4 py-3">
                              <div className="grid grid-cols-5 gap-4 items-center">
                                <span className="text-sm">{student?.name}</span>
                                <span className="text-sm">{quiz?.title}</span>
                                <span className="text-sm">{attempt.score}%</span>
                                <Badge variant={attempt.passed ? "default" : "destructive"}>
                                  {attempt.passed ? 'Pass' : 'Fail'}
                                </Badge>
                                <span className="text-sm">{attempt.attemptedAt.toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {users.filter(u => u.role === 'student').map(student => {
                      const studentAttempts = getUserAttempts(student.id.toString());
                      const passedAttempts = studentAttempts.filter(a => a.passed).length;
                      return (
                        <Card key={student.id} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{studentAttempts.length} attempts</p>
                              <p className="text-sm">{passedAttempts} passed</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Student Dashboard
          <Tabs defaultValue="available" className="space-y-6">
            <TabsList>
              <TabsTrigger value="available">Available Quizzes</TabsTrigger>
              <TabsTrigger value="history">My History</TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <div className="grid gap-6">
                <h2 className="text-xl font-semibold">Available Quizzes</h2>
                {quizzes.map(quiz => {
                  const userAttempts = attempts.filter(a => a.quizId === quiz.id && a.studentId === currentUser.id);
                  const lastAttempt = userAttempts[userAttempts.length - 1];
                  return (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{quiz.title}</CardTitle>
                            <CardDescription>{quiz.description}</CardDescription>
                          </div>
                          {lastAttempt && (
                            <Badge variant={lastAttempt.passed ? "default" : "secondary"}>
                              Last: {lastAttempt.score}% ({lastAttempt.passed ? 'Pass' : 'Fail'})
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600 space-x-4">
                            <span>{quiz.questions.length} questions</span>
                            <span>Passing score: {quiz.passingScore}%</span>
                            <span>Attempts: {userAttempts.length}</span>
                          </div>
                          <Button onClick={() => startQuiz(quiz)}>
                            Start Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
                          <div className="grid grid-cols-4 gap-4">
                            <span>Quiz</span>
                            <span>Score</span>
                            <span>Result</span>
                            <span>Date</span>
                          </div>
                        </div>
                        {getUserAttempts(currentUser.id.toString()).map(attempt => (
                          <div key={attempt.id} className="border-b px-4 py-3">
                            <div className="grid grid-cols-4 gap-4 items-center">
                              <span className="text-sm">{attempt.quizTitle}</span>
                              <span className="text-sm">{attempt.score}%</span>
                              <Badge variant={attempt.passed ? "default" : "destructive"}>
                                {attempt.passed ? 'Pass' : 'Fail'}
                              </Badge>
                              <span className="text-sm">{attempt.attemptedAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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