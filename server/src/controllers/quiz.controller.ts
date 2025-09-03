import { Request, Response } from 'express';
import QuizService from '../services/quiz.service';

export const QuizController = {
  async list(req: Request, res: Response) {
    try {
      const quizzes = await QuizService.list();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const quiz = await QuizService.get(id);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quiz' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId as number;
      const quiz = await QuizService.create(userId, req.body);
      res.status(201).json(quiz);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create quiz' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId as number;
      const id = Number(req.params.id);
      const status = await QuizService.update(userId, id, req.body);
      if (status === 'not_found') return res.status(404).json({ error: 'Quiz not found' });
      if (status === 'forbidden') return res.status(403).json({ error: 'Not authorized to update this quiz' });
      res.json({ message: 'Quiz updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update quiz' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId as number;
      const id = Number(req.params.id);
      const status = await QuizService.remove(userId, id);
      if (status === 'not_found') return res.status(404).json({ error: 'Quiz not found' });
      if (status === 'forbidden') return res.status(403).json({ error: 'Not authorized to delete this quiz' });
      res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete quiz' });
    }
  },

  async submit(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId as number;
      const id = Number(req.params.id);
      const result = await QuizService.submit(userId, id, req.body.answers);
      if (result === 'not_found') return res.status(404).json({ error: 'Quiz not found' });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  },

  async attempts(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await QuizService.attemptsByQuiz(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attempts' });
    }
  },

  async userAttempts(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId as number;
      const result = await QuizService.attemptsByUser(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user attempts' });
    }
  },
};

export default QuizController;


