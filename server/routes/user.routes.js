const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  saveAssessmentLevel,
  getAssessmentLevel
} = require('../controllers/user.controller');

// All routes are protected (require authentication)
router.post('/assessment', protect, saveAssessmentLevel);
router.get('/assessment', protect, getAssessmentLevel);

module.exports = router;
