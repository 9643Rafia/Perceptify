const Admin = require("../models/admin.model")
const User = require("../models/user.model")
const { generateToken } = require("../utils/jwt.utils")

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find admin by email
    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is deactivated",
      })
    }

    // Check password
    const isMatch = await admin.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    // Update last login
    await admin.updateLastLogin()

    // Generate JWT token with admin role
    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: "Admin",
      permissions: admin.permissions,
    })

    // Return admin data without password
    const adminResponse = admin.toObject()
    delete adminResponse.password

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      admin: adminResponse,
      token,
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during admin login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get current admin
exports.getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password")

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      })
    }

    res.status(200).json({
      success: true,
      admin,
    })
  } catch (error) {
    console.error("Get current admin error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ""
    const role = req.query.role || ""
    const status = req.query.status || ""

    // Build filter
    const filter = {}
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }
    if (role && role !== "All") {
      filter.role = role
    }
    if (status && status !== "All") {
      filter.status = status
    }

    const skip = (page - 1) * limit

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments(filter)

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Update user status (admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params
    const { status } = req.body

    if (!["active", "pending", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, pending, or suspended",
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    ).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!["Learner", "Guardian", "Educator"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be Learner, Guardian, or Educator",
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true }
    ).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user role error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Update user details (admin only)
exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const { fullName, email, age } = req.body

    // Validate email format
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      })
    }

    // Check if email already exists for another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists for another user",
        })
      }
    }

    const updateData = {}
    if (fullName) updateData.fullName = fullName
    if (email) updateData.email = email
    if (age) updateData.age = parseInt(age)
    updateData.updatedAt = new Date()

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user details error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ status: "active" })
    const pendingUsers = await User.countDocuments({ status: "pending" })
    const suspendedUsers = await User.countDocuments({ status: "suspended" })

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ])

    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5)

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        usersByRole,
        recentUsers
      }
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}