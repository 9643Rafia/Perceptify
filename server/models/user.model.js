const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true
  },
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
    minlength: [6, "Password must be at least 6 characters"]
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
    min: [1, "Age must be at least 1"],
    max: [120, "Age must be less than 120"]
  },
  role: {
    type: String,
    enum: ["Learner", "Guardian", "Educator"],
    required: [true, "Role is required"]
  },
  guardianEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    default: null
  },
  status: {
    type: String,
    enum: ["pending", "active"],
    default: "active"
  },
  learningLevel: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: null
  },
  assessmentScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  assessmentCompleted: {
    type: Boolean,
    default: false
  },
  assessmentDate: {
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
  },
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to check if user is a minor
userSchema.methods.isMinor = function () {
  return this.age < 18
}

const User = mongoose.model("User", userSchema)

module.exports = User
