import express from 'express';
import cors from 'cors';
import env from './src/config/env';
import initializeDatabase from './src/db/init';
import pool from './src/db/pool';
import authRoutes from './src/routes/auth.routes';
import quizRoutes from './src/routes/quiz.routes';

const app = express();
const PORT = env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

// Health check endpoint (includes DB ping)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: true, message: 'Quiz Management API is running' });
  } catch (e: any) {
    res.status(500).json({ status: 'ERROR', db: false, error: e?.message || 'DB error' });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
