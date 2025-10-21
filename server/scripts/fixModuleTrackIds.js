const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');

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

// Fix module trackIds
const fixModuleTrackIds = async () => {
  console.log('🔧 Fixing module trackId references...\n');

  try {
    await connectDB();

    // Mapping from old trackId format to new format
    const trackIdMapping = {
      'track_beginner': 'TRACK-001',
      'track_intermediate': 'TRACK-002',
      'track_advanced': 'TRACK-003'
    };

    // Mapping from old moduleId format to new format
    const moduleIdMapping = {
      'module_1.1': 'MOD-1.1',
      'module_1.2': 'MOD-1.2',
      'module_1.3': 'MOD-1.3',
      'module_2.1': 'MOD-2.1',
      'module_2.2': 'MOD-2.2',
      'module_2.3': 'MOD-2.3',
      'module_3.1': 'MOD-3.1',
      'module_3.2': 'MOD-3.2',
      'module_3.3': 'MOD-3.3',
      'module_3.4': 'MOD-3.4'
    };

    // Mapping from old lessonId format to new format
    const lessonIdMapping = {
      'lesson_1.1.1': 'LES-1.1.1',
      'lesson_1.1.2': 'LES-1.1.2',
      'lesson_1.1.3': 'LES-1.1.3',
      'lesson_1.2.1': 'LES-1.2.1',
      'lesson_1.2.2': 'LES-1.2.2',
      'lesson_1.2.3': 'LES-1.2.3',
      'lesson_1.3.1': 'LES-1.3.1',
      'lesson_1.3.2': 'LES-1.3.2',
      'lesson_1.3.3': 'LES-1.3.3',
      'lesson_2.1.1': 'LES-2.1.1',
      'lesson_2.1.2': 'LES-2.1.2',
      'lesson_2.1.3': 'LES-2.1.3',
      'lesson_2.2.1': 'LES-2.2.1',
      'lesson_2.2.2': 'LES-2.2.2',
      'lesson_2.2.3': 'LES-2.2.3',
      'lesson_2.3.1': 'LES-2.3.1',
      'lesson_3.1.1': 'LES-3.1.1',
      'lesson_3.1.2': 'LES-3.1.2',
      'lesson_3.1.3': 'LES-3.1.3',
      'lesson_3.2.1': 'LES-3.2.1',
      'lesson_3.2.2': 'LES-3.2.2',
      'lesson_3.2.3': 'LES-3.2.3',
      'lesson_3.3.1': 'LES-3.3.1',
      'lesson_3.3.2': 'LES-3.3.2',
      'lesson_3.3.3': 'LES-3.3.3',
      'lesson_3.4.1': 'LES-3.4.1'
    };

    console.log('📝 Updating Module trackIds...\n');

    const modules = await Module.find();
    let moduleUpdateCount = 0;

    for (const module of modules) {
      const oldTrackId = module.trackId;
      const newTrackId = trackIdMapping[oldTrackId];

      if (newTrackId && newTrackId !== oldTrackId) {
        module.trackId = newTrackId;
        await module.save();
        console.log(`✅ Updated module "${module.name}": ${oldTrackId} → ${newTrackId}`);
        moduleUpdateCount++;
      } else if (!newTrackId) {
        console.log(`⚠️  No mapping found for trackId: ${oldTrackId} in module ${module.name}`);
      }
    }

    console.log(`\n✅ Updated ${moduleUpdateCount} modules\n`);

    console.log('📝 Updating Lesson moduleIds...\n');

    const lessons = await Lesson.find();
    let lessonUpdateCount = 0;

    for (const lesson of lessons) {
      const oldModuleId = lesson.moduleId;
      const newModuleId = moduleIdMapping[oldModuleId];

      if (newModuleId && newModuleId !== oldModuleId) {
        lesson.moduleId = newModuleId;
        await lesson.save();
        console.log(`✅ Updated lesson "${lesson.name}": ${oldModuleId} → ${newModuleId}`);
        lessonUpdateCount++;
      } else if (!newModuleId) {
        console.log(`⚠️  No mapping found for moduleId: ${oldModuleId} in lesson ${lesson.name}`);
      }
    }

    console.log(`\n✅ Updated ${lessonUpdateCount} lessons\n`);

    console.log('📝 Updating Content lessonIds...\n');

    const contents = await Content.find();
    let contentUpdateCount = 0;

    for (const content of contents) {
      const oldLessonId = content.lessonId;
      const newLessonId = lessonIdMapping[oldLessonId];

      if (newLessonId && newLessonId !== oldLessonId) {
        content.lessonId = newLessonId;
        await content.save();
        console.log(`✅ Updated content "${content.title}": ${oldLessonId} → ${newLessonId}`);
        contentUpdateCount++;
      } else if (!newLessonId) {
        console.log(`⚠️  No mapping found for lessonId: ${oldLessonId} in content ${content.title}`);
      }
    }

    console.log(`\n✅ Updated ${contentUpdateCount} content items\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   • Modules updated: ${moduleUpdateCount}`);
    console.log(`   • Lessons updated: ${lessonUpdateCount}`);
    console.log(`   • Content items updated: ${contentUpdateCount}`);
    console.log(`\n🎉 Modules should now appear in the course view!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing trackIds:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
fixModuleTrackIds();
