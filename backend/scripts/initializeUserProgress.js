const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/user.model');
const Progress = require('../models/progress.model');
const Track = require('../models/track.model');

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

// Initialize progress for a user
const initializeUserProgress = async (userId) => {
  try {
    // Check if progress already exists
    const existingProgress = await Progress.findOne({ userId });
    if (existingProgress) {
      console.log('⚠️  Progress already exists for this user');
      return existingProgress;
    }

    // Get all tracks
    const tracks = await Track.find({ status: 'active' }).sort({ order: 1 });

    // Create initial progress
    const tracksProgress = tracks.map((track, index) => ({
      trackId: track._id,
      status: index === 0 ? 'unlocked' : 'locked', // Unlock first track only
      modulesProgress: [],
      overallScore: 0
    }));

    const progress = new Progress({
      userId,
      currentTrack: tracks[0]?._id || null,
      tracksProgress,
      totalXP: 0,
      level: 1,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null
      },
      totalTimeSpent: 0
    });

    await progress.save();
    console.log('✅ User progress initialized successfully');
    return progress;
  } catch (error) {
    console.error('❌ Error initializing progress:', error.message);
    throw error;
  }
};

// Initialize progress for all users without progress
const initializeAllUsersProgress = async () => {
  console.log('🚀 Initializing progress for all users...\n');

  try {
    await connectDB();

    // Get all active learners
    const users = await User.find({ role: 'Learner', status: 'active' });
    console.log(`Found ${users.length} learner(s)\n`);

    let initializedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.email}...`);

      // Check if progress exists
      const existingProgress = await Progress.findOne({ userId: user._id });

      if (existingProgress) {
        console.log(`  ⏭️  Skipped - Progress already exists\n`);
        skippedCount++;
        continue;
      }

      await initializeUserProgress(user._id);
      console.log(`  ✅ Progress initialized\n`);
      initializedCount++;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Summary:');
    console.log(`  Total users: ${users.length}`);
    console.log(`  Initialized: ${initializedCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run the script
initializeAllUsersProgress();
