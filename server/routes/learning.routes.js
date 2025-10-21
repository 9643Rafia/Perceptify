const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const protect  = require('../middleware/auth.middleware');

// Track routes
router.get('/tracks', learningController.getTracks);
router.get('/tracks/:trackId', protect, learningController.getTrackById);

// Module routes
router.get('/tracks/:trackId/modules', protect, learningController.getModulesByTrack);
router.get('/modules/:moduleId', protect, learningController.getModuleById);

// Lesson routes
router.get('/modules/:moduleId/lessons', protect, learningController.getLessonsByModule);
router.get('/lessons/:lessonId', protect, learningController.getLessonById);

// Content routes
router.get('/content/:contentId', protect, learningController.getContentById);

// Learning path
router.get('/next', protect, learningController.getNextContent);

module.exports = router;
