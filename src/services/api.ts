const API_BASE_URL = 'http://localhost:5000/api';

// Auth service
export const authService = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  },

  async register(email: string, password: string, name: string, role: string = 'student') {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  },

  async verifyToken() {
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
      throw new Error('Token verification failed');
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem('token');
  }
};

// Quiz service
export const quizService = {
  async getQuizzes() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    return response.json();
  },

  async getQuiz(id: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz');
    }

    return response.json();
  },

  async createQuiz(quiz: any) {
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
      throw new Error('Failed to create quiz');
    }

    return response.json();
  },

  async updateQuiz(id: number, quiz: any) {
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
      throw new Error('Failed to update quiz');
    }

    return response.json();
  },

  async deleteQuiz(id: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete quiz');
    }

    return response.json();
  },

  async submitQuiz(id: number, answers: number[]) {
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
      throw new Error('Failed to submit quiz');
    }

    return response.json();
  },

  async getQuizAttempts(id: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}/attempts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz attempts');
    }

    return response.json();
  },

  async getUserAttempts() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/quizzes/user/attempts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user attempts');
    }

    return response.json();
  }
};
