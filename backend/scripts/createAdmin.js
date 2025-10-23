const mongoose = require("mongoose")
require('dotenv').config()
const Admin = require("../models/admin.model")
const connectDB = require("../config/db")

const createDefaultAdmin = async () => {
  try {
    // Connect to database
    await connectDB()

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@gmail.com" })
    if (existingAdmin) {
      console.log("❌ Default admin already exists")
      process.exit(0)
    }

    // Create default admin
    const admin = new Admin({
      email: "admin@gmail.com",
      password: "admin123",
      permissions: ["manage_users", "manage_content", "view_analytics", "system_settings"]
    })

    await admin.save()
    console.log("✅ Default admin created successfully")
    console.log("Email: admin@gmail.com")
    console.log("Password: admin123")
    console.log("⚠️  Please change the default password after first login")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating admin:", error)
    process.exit(1)
  }
}

createDefaultAdmin()