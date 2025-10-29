const fs = require('fs')
const path = require('path')

// Simple bearer token check middleware (can be replaced with real auth)
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })
  const token = auth.slice(7)
  // For now accept token value from env as a quick secret for dev/testing
  if (process.env.MEDIA_ACCESS_TOKEN && token === process.env.MEDIA_ACCESS_TOKEN) return next()
  // Fallback: if no MEDIA_ACCESS_TOKEN configured, reject
  return res.status(401).json({ message: 'Unauthorized' })
}

// Stream a file supporting Range requests from backend/public/media
const streamMedia = (req, res) => {
  const relPath = req.params[0] || ''
  const mediaRoot = path.join(__dirname, '..', 'public', 'media')
  const filePath = path.join(mediaRoot, relPath)

  // Prevent path traversal
  if (!filePath.startsWith(mediaRoot)) return res.status(400).json({ message: 'Invalid path' })

  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Not found' })

  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const range = req.headers.range

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    if (start >= fileSize || end >= fileSize) {
      res.status(416).set({ 'Content-Range': `bytes */${fileSize}` }).end()
      return
    }
    const chunkSize = (end - start) + 1
    const file = fs.createReadStream(filePath, { start, end })
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': getMimeType(filePath),
    })
    file.pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': getMimeType(filePath),
    })
    fs.createReadStream(filePath).pipe(res)
  }
}

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.mp4': return 'video/mp4'
    case '.webm': return 'video/webm'
    case '.mov': return 'video/quicktime'
    case '.pdf': return 'application/pdf'
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    default: return 'application/octet-stream'
  }
}

module.exports = { verifyToken, streamMedia }
