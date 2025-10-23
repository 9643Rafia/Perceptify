const express = require("express")
const path = require("path")
const cors = require("cors")
const morgan = require("morgan")
const connectDB = require("./config/db")
const config = require("./config/config")
require('dotenv').config();

// Import routes
const authRoutes = require("./routes/auth.routes")
const assessmentRoutes = require("./routes/assessment.routes")
const userRoutes = require("./routes/user.routes")
const learningRoutes = require("./routes/learning.routes")
const quizRoutes = require("./routes/quiz.routes")
const progressRoutes = require("./routes/progress.routes")
const adminRoutes = require("./routes/admin.routes")
const forumRoutes = require("./routes/forum.routes")
const mediaRoutes = require('./routes/media.routes')

// Connect to database
connectDB()

// Initialize express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`)
  console.log('📋 Headers:', req.headers)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body)
  }
  next()
})

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/assessment", assessmentRoutes)
app.use("/api/users", userRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/forum', forumRoutes)
app.use('/media', mediaRoutes)


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Server Error",
    error: config.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Start server
const PORT = config.PORT
app.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`)
})