const express = require("express")
const router = express.Router()
const {
  adminLogin,
  getCurrentAdmin,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  updateUserDetails,
  deleteUser,
  getDashboardStats
} = require("../controllers/admin.controller")
const authMiddleware = require("../middleware/auth.middleware")

// Admin authentication routes
router.post("/login", adminLogin)

// Protected admin routes (require authentication)
router.get("/me", authMiddleware, getCurrentAdmin)
router.get("/stats", authMiddleware, getDashboardStats)

// User management routes
router.get("/users", authMiddleware, getAllUsers)
router.patch("/users/:userId/status", authMiddleware, updateUserStatus)
router.patch("/users/:userId/role", authMiddleware, updateUserRole)
router.patch("/users/:userId/details", authMiddleware, updateUserDetails)
router.delete("/users/:userId", authMiddleware, deleteUser)

module.exports = router