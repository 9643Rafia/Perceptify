const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');

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

const debugLessonRelationships = async () => {
  console.log('🔍 Debugging module-lesson relationships...\n');

  try {
    await connectDB();

    // Get all modules
    const modules = await Module.find({}).sort({ order: 1 });
    console.log('📚 Found modules:', modules.length);

    for (const module of modules) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📚 Module:', module.name);
      console.log('   _id:', module._id);
      console.log('   moduleId:', module.moduleId);
      
      // Try both ways to find lessons
      const lessonsByModuleId = await Lesson.find({ moduleId: module.moduleId });
      const lessonsByModuleObjectId = await Lesson.find({ moduleId: module._id });
      
      console.log('   Lessons found by moduleId (' + module.moduleId + '):', lessonsByModuleId.length);
      console.log('   Lessons found by _id (' + module._id + '):', lessonsByModuleObjectId.length);
      
      if (lessonsByModuleObjectId.length > 0) {
        console.log('   ✅ Lessons found using _id:');
        lessonsByModuleObjectId.forEach(lesson => {
          console.log(`     - ${lesson.name} (${lesson._id})`);
        });
      }
      
      if (lessonsByModuleId.length > 0) {
        console.log('   ✅ Lessons found using moduleId:');
        lessonsByModuleId.forEach(lesson => {
          console.log(`     - ${lesson.name} (${lesson._id})`);
        });
      }
      
      if (lessonsByModuleId.length === 0 && lessonsByModuleObjectId.length === 0) {
        console.log('   ❌ No lessons found with either method');
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 All lessons in database:');
    const allLessons = await Lesson.find({});
    allLessons.forEach(lesson => {
      console.log(`   - ${lesson.name} (moduleId: ${lesson.moduleId})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

debugLessonRelationships();