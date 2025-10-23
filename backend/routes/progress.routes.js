const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const protect  = require('../middleware/auth.middleware');

// Progress routes
router.get('/me', protect, progressController.getUserProgress);
router.post('/tracks/:trackId/start', protect, progressController.startTrack);
router.post('/lessons/:lessonId/start', protect, progressController.startLesson);
router.put('/lessons/:lessonId/update', protect, progressController.updateLessonProgress);
router.post('/lessons/:lessonId/complete', protect, progressController.completeLesson);

// Dashboard
router.get('/dashboard/stats', protect, progressController.getDashboardStats);
router.get('/analytics', protect, progressController.getAnalytics);

// Gamification
router.get('/badges', protect, progressController.getUserBadges);
router.get('/leaderboard', protect, progressController.getLeaderboard);

// Certificates
router.get('/certificates', protect, progressController.getUserCertificates);
router.get('/certificates/verify/:verificationCode', progressController.verifyCertificate);

module.exports = router;
