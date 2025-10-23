const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Progress = require('../models/progress.model');
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');

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

const fixProgressRelationships = async () => {
  await connectDB();
  const tracks = await Track.find({});
  const modules = await Module.find({});
  const lessons = await Lesson.find({});

  // Build lookup maps
  const trackIdMap = {};
  tracks.forEach(t => { trackIdMap[t.trackId] = t._id.toString(); });
  const moduleIdMap = {};
  modules.forEach(m => { moduleIdMap[m.moduleId] = m._id.toString(); });
  const lessonIdMap = {};
  lessons.forEach(l => { lessonIdMap[l.lessonId] = l._id.toString(); });

  const progresses = await Progress.find({});
  let updatedCount = 0;

  for (const progress of progresses) {
    let changed = false;
    // Fix tracksProgress
    for (const tp of progress.tracksProgress) {
      if (trackIdMap[tp.trackId]) {
        if (tp.trackId !== trackIdMap[tp.trackId]) {
          tp.trackId = trackIdMap[tp.trackId];
          changed = true;
        }
      }
      // Fix modulesProgress
      for (const mp of tp.modulesProgress) {
        if (moduleIdMap[mp.moduleId]) {
          if (mp.moduleId !== moduleIdMap[mp.moduleId]) {
            mp.moduleId = moduleIdMap[mp.moduleId];
            changed = true;
          }
        }
        // Fix lessonsProgress
        for (const lp of mp.lessonsProgress) {
          if (lessonIdMap[lp.lessonId]) {
            if (lp.lessonId !== lessonIdMap[lp.lessonId]) {
              lp.lessonId = lessonIdMap[lp.lessonId];
              changed = true;
            }
          }
        }
      }
    }
    if (changed) {
      await progress.save();
      updatedCount++;
      console.log(`✅ Updated progress for user ${progress.userId}`);
    }
  }
  console.log(`\n🎉 Updated ${updatedCount} progress documents!`);
  process.exit(0);
};

fixProgressRelationships();
