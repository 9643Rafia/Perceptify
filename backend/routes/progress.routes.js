const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const protect = require('../middleware/auth.middleware');
const ctrl = require('../controllers/track.controller');

router.get('/me', protect, progressController.getUserProgress);
router.post('/:trackId/start', protect, ctrl.startTrack);
router.post('/lesson/:lessonId/start', protect, ctrl.startLesson);
router.patch('/lesson/:lessonId/progress', protect, progressController.updateLessonProgress);
router.post('/lesson/:lessonId/complete', protect, progressController.completeLesson);

module.exports = router;
