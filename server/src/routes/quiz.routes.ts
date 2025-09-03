import express from 'express';
import QuizController from '../controllers/quiz.controller';
import authenticateToken from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, QuizController.list);
router.get('/:id', authenticateToken, QuizController.get);
router.post('/', authenticateToken, QuizController.create);
router.put('/:id', authenticateToken, QuizController.update);
router.delete('/:id', authenticateToken, QuizController.remove);
router.post('/:id/submit', authenticateToken, QuizController.submit);
router.get('/:id/attempts', authenticateToken, QuizController.attempts);
router.get('/user/attempts', authenticateToken, QuizController.userAttempts);

export default router;


