const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Progress = require('../models/progress.model');

const USER_ID = '68f7fe92d2c86928cdc101b5'; // sohaibmayo12@gmail.com

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

const deleteUserProgress = async () => {
  await connectDB();
  const result = await Progress.deleteMany({ userId: USER_ID });
  console.log(`🗑️ Deleted ${result.deletedCount} progress documents for user ${USER_ID}`);
  process.exit(0);
};

deleteUserProgress();
