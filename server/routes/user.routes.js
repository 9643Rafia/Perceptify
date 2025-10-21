const express = require('express');
const router = express.Router();
const protect  = require('../middleware/auth.middleware');
const {
  saveAssessmentLevel,
  getAssessmentLevel,
  getUserProfile
} = require('../controllers/user.controller');

// All routes are protected (require authentication)
router.post('/assessment', protect, saveAssessmentLevel);
router.get('/assessment', protect, getAssessmentLevel);
router.get('/profile', protect, getUserProfile);

module.exports = router;
