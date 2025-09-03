import type { QuizDto, QuizAttemptResultDto } from '@/types';

const API_BASE_URL = '/api';

async function parseJsonSafe(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text || `HTTP ${response.status}`);
    }
  }
  return response.json();
}

// Auth service
export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: any; }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Login failed');
    }

    const data = await parseJsonSafe(response);
    localStorage.setItem('token', data.token);
    return data;
  },

  async register(email: string, password: string, name: string, role: string = 'student'): Promise<{ token: string; user: any; }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Registration failed');
    }

    const data = await parseJsonSafe(response);
    localStorage.setItem('token', data.token);
    return data;
  },

  async verifyToken(): Promise<{ user: any; }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem('token');
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Token verification failed');
    }

    return parseJsonSafe(response);
  },

  logout() {
    localStorage.removeItem('token');
  }
};

// Quiz service
export const quizService = {
  async getQuizzes(): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to fetch quizzes');
    }

    return parseJsonSafe(response);
  },

  async getQuiz(id: number): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to fetch quiz');
    }

    return parseJsonSafe(response);
  },

  async createQuiz(quiz: QuizDto): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(quiz),
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to create quiz');
    }

    return parseJsonSafe(response);
  },

  async updateQuiz(id: number, quiz: QuizDto): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(quiz),
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to update quiz');
    }

    return parseJsonSafe(response);
  },

  async deleteQuiz(id: number): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to delete quiz');
    }

    return parseJsonSafe(response);
  },

  async submitQuiz(id: number, answers: number[]): Promise<QuizAttemptResultDto> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to submit quiz');
    }

    return parseJsonSafe(response);
  },

  async getQuizAttempts(id: number): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}/attempts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to fetch quiz attempts');
    }

    return parseJsonSafe(response);
  },

  async getUserAttempts(): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/user/attempts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      throw new Error((data && data.error) || 'Failed to fetch user attempts');
    }

    return parseJsonSafe(response);
  }
};
