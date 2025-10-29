const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const auth = require('../middleware/auth.middleware');

router.get('/dashboard', auth, ctrl.getDashboardStats);

module.exports = router;
