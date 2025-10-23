const { verifyToken } = require("../utils/jwt.utils")

module.exports = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      })
    }

    // Verify token
    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    // Add user from payload to request
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token is not valid",
    })
  }
}
