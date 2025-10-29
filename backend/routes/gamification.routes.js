const express = require('express');
const router = express.Router();
const controller = require('../controllers/gamification.controller');
const protect = require('../middleware/auth.middleware');

router.get('/badges', protect, controller.getUserBadges);
router.get('/leaderboard', protect, controller.getLeaderboard);

module.exports = router;
