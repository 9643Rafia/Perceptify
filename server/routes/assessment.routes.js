const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/optionalAuth.middleware');
const {
  submitAssessment,
  getMyAssessment,
  checkAssessment
} = require('../controllers/assessment.controller');

// Submit route allows both authenticated and anonymous users
router.post('/submit', optionalAuth, submitAssessment);

// These routes require authentication
router.get('/me', protect, getMyAssessment);
router.get('/check', protect, checkAssessment);

module.exports = router;
