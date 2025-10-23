const express = require('express')
const router = express.Router()
const { verifyToken, streamMedia } = require('../controllers/media.controller')

// Route to stream any file under backend/public/media
// Example: GET /media/videos/sample-video.mp4
router.get('/*', verifyToken, streamMedia)

module.exports = router
