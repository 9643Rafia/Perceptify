const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const  protect = require('../middleware/auth.middleware');

// Quiz routes
router.get('/:quizId', protect, quizController.getQuizById);
router.post('/:quizId/submit', protect, quizController.submitQuiz);

// Lab routes
router.get('/labs/:labId', protect, quizController.getLabById);
router.post('/labs/:labId/submit', protect, quizController.submitLab);

module.exports = router;
