import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role = 'student' } = req.body;
      const result = await AuthService.register(email, password, name, role);
      res.status(201).json({ message: 'User created successfully', ...result });
    } catch (error: any) {
      const status = error.message === 'User already exists' ? 400 : 500;
      res.status(status).json({ error: 'Registration failed', details: error?.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json({ message: 'Login successful', ...result });
    } catch (error: any) {
      const status = error.message === 'Invalid credentials' ? 401 : 500;
      res.status(status).json({ error: 'Login failed', details: error?.message });
    }
  },

  async verify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });
      const result = await AuthService.verify(token);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },
};

export default AuthController;


