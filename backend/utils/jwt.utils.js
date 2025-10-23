const jwt = require("jsonwebtoken")

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "perceptify123"

// Generate JWT token
exports.generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

// Verify JWT token
exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}
