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

const printUserProgress = async () => {
  await connectDB();
  const progresses = await Progress.find({});
  for (const progress of progresses) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User:', progress.userId);
    for (const tp of progress.tracksProgress) {
      console.log('  Track:', tp.trackId);
      for (const mp of tp.modulesProgress) {
        console.log('    Module:', mp.moduleId);
        for (const lp of mp.lessonsProgress) {
          console.log('      Lesson:', lp.lessonId, '| Status:', lp.status);
        }
      }
    }
  }
  process.exit(0);
};

printUserProgress();
