const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/user.model');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Create test user
const createTestUser = async () => {
  console.log('🧪 Creating test user...\n');

  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'sohaibmayo12@gmail.com' });

    if (existingUser) {
      console.log('⚠️  Test user already exists!');
      console.log('\nTest User Credentials:');
      console.log('Email: sohaibmayo12@gmail.com');
      console.log('Password: Test@123');
      console.log('Role: Learner');
      console.log('Status: active\n');
      process.exit(0);
    }

    // Create new test user
    const testUser = new User({
      fullName: 'Test Learner',
      email: 'sohaibmayo12@gmail.com',
      password: 'Test@123', // Will be hashed by pre-save hook
      age: 25,
      role: 'Learner',
      status: 'active'
    });

    await testUser.save();

    console.log('✅ Test user created successfully!\n');
    console.log('Test User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: sohaibmayo12@gmail.com');
    console.log('Password: Test@123');
    console.log('Role: Learner');
    console.log('Status: active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('You can now login with these credentials!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
};

// Run the script
createTestUser();
