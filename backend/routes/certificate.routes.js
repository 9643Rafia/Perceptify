const express = require('express');
const router = express.Router();
const controller = require('../controllers/certificate.controller');
const protect = require('../middleware/auth.middleware');

router.get('/', protect, controller.getUserCertificates);
router.get('/verify/:verificationCode', controller.verifyCertificate);

module.exports = router;
