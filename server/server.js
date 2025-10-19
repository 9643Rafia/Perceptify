const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const connectDB = require("./config/db")
const config = require("./config/config")
require('dotenv').config();

// Import routes
const authRoutes = require("./routes/auth.routes")
const assessmentRoutes = require("./routes/assessment.routes")
const userRoutes = require("./routes/user.routes")

// Connect to database
connectDB()

// Initialize express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/assessment", assessmentRoutes)
app.use("/api/users", userRoutes)

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
