const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const protect = require('../middleware/auth.middleware');

// --- LAB ROUTES
router.get('/labs/:labId', protect, quizController.getLabById);
router.post('/labs/:labId/submit', protect, quizController.submitLab);

// --- QUIZ ROUTES ---
router.get('/:quizId', protect, quizController.getQuizById);
router.post('/:quizId/submit', protect, quizController.submitQuiz);

module.exports = router;
