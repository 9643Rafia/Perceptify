const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"]
  },
  role: {
    type: String,
    default: "Admin"
  },
  permissions: {
    type: [String],
    default: ["manage_users", "manage_content", "view_analytics", "system_settings"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Pre-save hook to hash password
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to check if admin has permission
adminSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission)
}

// Method to update last login
adminSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date()
  return this.save()
}

const Admin = mongoose.model("Admin", adminSchema)

module.exports = Admin