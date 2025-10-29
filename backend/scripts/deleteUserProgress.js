const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Progress = require('../models/progress.model');

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

  const args = process.argv.slice(2);
  const deleteAll = args.includes('--all') || args.includes('-a');
  const explicitUserId = args.find(arg => !arg.startsWith('-'));

  if (!deleteAll && !explicitUserId) {
    console.error('⚠️  Usage: node deleteUserProgress.js [--all|-a] OR node deleteUserProgress.js <userId>');
    process.exit(1);
  }

  let filter = {};
  if (!deleteAll) {
    let userId = explicitUserId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userId = new mongoose.Types.ObjectId(userId);
    }
    filter = { userId };
  }

  const result = await Progress.deleteMany(filter);
  if (deleteAll) {
    console.log(`🗑️ Deleted ${result.deletedCount} progress documents (all users)`);
  } else {
    console.log(`🗑️ Deleted ${result.deletedCount} progress documents for user ${explicitUserId}`);
  }
  process.exit(0);
};

deleteUserProgress();
