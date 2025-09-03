import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import env from '../config/env';
import { JwtUserPayload } from '../types';

export const AuthService = {
  async register(email: string, password: string, name: string, role: 'admin' | 'student' = 'student') {
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JwtUserPayload,
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token, user };
  },

  async login(email: string, password: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JwtUserPayload,
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },

  async verify(token: string) {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    return { user: result.rows[0] };
  },
};

export default AuthService;


