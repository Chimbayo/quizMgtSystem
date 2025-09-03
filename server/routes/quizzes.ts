import express from 'express';
import pool from '../database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all quizzes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, u.name as creator_name,
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
      FROM quizzes q
      JOIN users u ON q.created_by = u.id
      ORDER BY q.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quiz by ID with questions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id',
      [quizId]
    );

    const quiz = quizResult.rows[0];
    quiz.questions = questionsResult.rows;

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new quiz
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, passingScore, questions } = req.body;
    const userId = (req as any).user.userId;

    // Create quiz
    const quizResult = await pool.query(
      'INSERT INTO quizzes (title, description, passing_score, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, passingScore, userId]
    );

    const quiz = quizResult.rows[0];

    // Add questions
    for (const question of questions) {
      await pool.query(
        'INSERT INTO questions (quiz_id, question, type, options, correct_answer) VALUES ($1, $2, $3, $4, $5)',
        [quiz.id, question.question, question.type, JSON.stringify(question.options), question.correctAnswer]
      );
    }

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quiz
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { title, description, passingScore, questions } = req.body;
    const userId = (req as any).user.userId;

    // Check if user owns the quiz
    const quizCheck = await pool.query('SELECT created_by FROM quizzes WHERE id = $1', [quizId]);
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (quizCheck.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this quiz' });
    }

    // Update quiz
    await pool.query(
      'UPDATE quizzes SET title = $1, description = $2, passing_score = $3 WHERE id = $4',
      [title, description, passingScore, quizId]
    );

    // Delete existing questions
    await pool.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);

    // Add new questions
    for (const question of questions) {
      await pool.query(
        'INSERT INTO questions (quiz_id, question, type, options, correct_answer) VALUES ($1, $2, $3, $4, $5)',
        [quizId, question.question, question.type, JSON.stringify(question.options), question.correctAnswer]
      );
    }

    res.json({ message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete quiz
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = (req as any).user.userId;

    // Check if user owns the quiz
    const quizCheck = await pool.query('SELECT created_by FROM quizzes WHERE id = $1', [quizId]);
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (quizCheck.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }

    await pool.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit quiz attempt
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers } = req.body;
    const userId = (req as any).user.userId;

    // Get quiz and questions
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id',
      [quizId]
    );

    const quiz = quizResult.rows[0];
    const questions = questionsResult.rows;

    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passing_score;

    // Save attempt
    await pool.query(
      'INSERT INTO quiz_attempts (student_id, quiz_id, answers, score, passed) VALUES ($1, $2, $3, $4, $5)',
      [userId, quizId, JSON.stringify(answers), score, passed]
    );

    res.json({
      score,
      passed,
      correctCount,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quiz attempts
router.get('/:id/attempts', authenticateToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    
    const result = await pool.query(`
      SELECT qa.*, u.name as student_name, u.email as student_email
      FROM quiz_attempts qa
      JOIN users u ON qa.student_id = u.id
      WHERE qa.quiz_id = $1
      ORDER BY qa.attempted_at DESC
    `, [quizId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's quiz attempts
router.get('/user/attempts', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const result = await pool.query(`
      SELECT qa.*, q.title as quiz_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.student_id = $1
      ORDER BY qa.attempted_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
