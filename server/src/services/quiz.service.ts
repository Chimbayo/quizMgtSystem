import pool from '../db/pool';
import { CreateQuizDto, QuizAttemptResult } from '../types';

export const QuizService = {
  async list() {
    const result = await pool.query(`
      SELECT q.*, u.name as creator_name,
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
      FROM quizzes q
      JOIN users u ON q.created_by = u.id
      ORDER BY q.created_at DESC
    `);
    return result.rows;
  },

  async get(id: number) {
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) {
      return null;
    }
    const questionsResult = await pool.query('SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id', [id]);
    const quiz = quizResult.rows[0];
    quiz.questions = questionsResult.rows;
    return quiz;
  },

  async create(userId: number, dto: CreateQuizDto) {
    const quizResult = await pool.query(
      'INSERT INTO quizzes (title, description, passing_score, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [dto.title, dto.description, dto.passingScore, userId]
    );
    const quiz = quizResult.rows[0];
    for (const question of dto.questions) {
      await pool.query(
        'INSERT INTO questions (quiz_id, question, type, options, correct_answer) VALUES ($1, $2, $3, $4, $5)',
        [quiz.id, question.question, question.type, JSON.stringify(question.options), question.correctAnswer]
      );
    }
    return quiz;
  },

  async update(userId: number, id: number, dto: CreateQuizDto) {
    const quizCheck = await pool.query('SELECT created_by FROM quizzes WHERE id = $1', [id]);
    if (quizCheck.rows.length === 0) return 'not_found';
    if (quizCheck.rows[0].created_by !== userId) return 'forbidden';

    await pool.query('UPDATE quizzes SET title = $1, description = $2, passing_score = $3 WHERE id = $4', [
      dto.title,
      dto.description,
      dto.passingScore,
      id,
    ]);
    await pool.query('DELETE FROM questions WHERE quiz_id = $1', [id]);
    for (const question of dto.questions) {
      await pool.query(
        'INSERT INTO questions (quiz_id, question, type, options, correct_answer) VALUES ($1, $2, $3, $4, $5)',
        [id, question.question, question.type, JSON.stringify(question.options), question.correctAnswer]
      );
    }
    return 'ok';
  },

  async remove(userId: number, id: number) {
    const quizCheck = await pool.query('SELECT created_by FROM quizzes WHERE id = $1', [id]);
    if (quizCheck.rows.length === 0) return 'not_found';
    if (quizCheck.rows[0].created_by !== userId) return 'forbidden';
    await pool.query('DELETE FROM quizzes WHERE id = $1', [id]);
    return 'ok';
  },

  async submit(userId: number, id: number, answers: number[]): Promise<QuizAttemptResult | 'not_found'> {
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) return 'not_found';
    const questionsResult = await pool.query('SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id', [id]);
    const quiz = quizResult.rows[0];
    const questions = questionsResult.rows;
    let correctCount = 0;
    questions.forEach((question: any, index: number) => {
      if (answers[index] === question.correct_answer) correctCount++;
    });
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passing_score;
    await pool.query(
      'INSERT INTO quiz_attempts (student_id, quiz_id, answers, score, passed) VALUES ($1, $2, $3, $4, $5)',
      [userId, id, JSON.stringify(answers), score, passed]
    );
    return { score, passed, correctCount, totalQuestions: questions.length };
  },

  async attemptsByQuiz(id: number) {
    const result = await pool.query(
      `SELECT qa.*, u.name as student_name, u.email as student_email
       FROM quiz_attempts qa
       JOIN users u ON qa.student_id = u.id
       WHERE qa.quiz_id = $1
       ORDER BY qa.attempted_at DESC`,
      [id]
    );
    return result.rows;
  },

  async attemptsByUser(userId: number) {
    const result = await pool.query(
      `SELECT qa.*, q.title as quiz_title
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.student_id = $1
       ORDER BY qa.attempted_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

export default QuizService;


