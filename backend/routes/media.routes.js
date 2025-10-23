const express = require('express')
const router = express.Router()
// const { verifyToken, streamMedia } = require('../controllers/media.controller')
const { streamMedia } = require('../controllers/media.controller')

// Route to stream any file under backend/public/media (no token required)
// Example: GET /media/videos/sample-video.mp4
// router.get('/*', verifyToken, streamMedia)
router.get('/*', streamMedia)

module.exports = router
