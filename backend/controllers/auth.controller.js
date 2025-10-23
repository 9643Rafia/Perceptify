const User = require("../models/user.model")
const { generateToken, verifyToken } = require("../utils/jwt.utils")
const sendEmail = require("../utils/email.utils")

// Register a new user
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, age, role, guardianEmail } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Determine if user is a minor
    const isMinor = Number.parseInt(age) < 18
    const status = isMinor ? "pending" : "active"

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      age: Number.parseInt(age),
      role,
      guardianEmail: isMinor ? guardianEmail : null,
      status,
    })

const savedUser = await user.save();
console.log("✅ User saved to DB:", savedUser);

   // await user.save()

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    })

    // If minor, send email to guardian
    if (isMinor && guardianEmail) {
      const approvalToken = generateToken({ userId: user._id }, "7d")
      const approvalUrl = `${process.env.FRONTEND_URL}/guardian-approval?token=${approvalToken}`

      await sendEmail({
        to: guardianEmail,
        subject: "Guardian Approval Required for Perceptify Account",
        text: `Hello, ${fullName} has registered for a Perceptify account and requires your approval as their guardian. Please click the following link to approve: ${approvalUrl}`,
        html: `
          <h1>Guardian Approval Required</h1>
          <p>${fullName} has registered for a Perceptify account and requires your approval as their guardian.</p>
          <p>Please click the button below to approve:</p>
          <a href="${approvalUrl}" style="background-color: #00bfa6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Approve Account</a>
        `,
      })
    }

    // Return user data without password
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json({
      success: true,
      message: isMinor ? "Registration pending guardian approval" : "Registration successful",
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if account is pending approval
    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Account pending guardian approval",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    })

    // Return user data without password
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Approve minor's account
exports.approveAccount = async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Approval token is required",
      })
    }

    // Verify token
    let decoded
    try {
      decoded = verifyToken(token)
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired approval token",
      })
    }

    // Update user status
    const user = await User.findByIdAndUpdate(decoded.userId, { status: "active" }, { new: true })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Account approved successfully",
      userId: user._id,
    })
  } catch (error) {
    console.error("Approval error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during approval",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
