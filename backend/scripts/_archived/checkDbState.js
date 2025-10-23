const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');
const Progress = require('../models/progress.model');

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('DB connect error:', err.message);
    process.exit(1);
  }
};

(async () => {
  await connect();
  try {
    const counts = await Promise.all([
      Track.countDocuments(),
      Module.countDocuments(),
      Lesson.countDocuments(),
      Content.countDocuments(),
      Progress.countDocuments()
    ]);

    console.log('\n📊 Database counts:');
    console.log(`  Tracks: ${counts[0]}`);
    console.log(`  Modules: ${counts[1]}`);
    console.log(`  Lessons: ${counts[2]}`);
    console.log(`  Content items: ${counts[3]}`);
    console.log(`  Progress docs: ${counts[4]}`);

    const sampleModules = await Module.find({}).limit(10).select('name moduleId trackId quizId');
    console.log('\n🔎 Sample modules (up to 10):');
    sampleModules.forEach(m => console.log(` - ${m.moduleId || m._id}: ${m.name} (quizId=${m.quizId || ''})`));

    // show one sample progress doc if any
    const prog = await Progress.findOne({}).limit(1);
    if (prog) {
      console.log('\n🧾 Sample progress document found for userId:', prog.userId);
      console.log(' tracksProgress length:', (prog.tracksProgress || []).length);
    } else {
      console.log('\n🧾 No progress documents found');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error checking DB state:', err);
    process.exit(1);
  }
})();
