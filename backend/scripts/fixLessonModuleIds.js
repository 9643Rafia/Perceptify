const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
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

const fixLessonModuleIds = async () => {
  console.log('🔧 Fixing lesson moduleId references...\n');

  try {
    await connectDB();

    // Create mapping of old moduleId to new ObjectId
    const moduleMapping = {
      'module_1.1': null,
      'module_1.2': null,
      'module_1.3': null,
      'module_2.1': null,
      'module_2.2': null,
      'module_2.3': null,
      'module_3.1': null,
      'module_3.2': null,
      'module_3.3': null,
      'module_3.4': null
    };

    // Get modules and build mapping
    const modules = await Module.find({});
    
    // Map based on moduleId patterns
    for (const module of modules) {
      const { moduleId } = module;
      let oldModuleId = null;
      
      switch (moduleId) {
        case 'MOD-1.1': oldModuleId = 'module_1.1'; break;
        case 'MOD-1.2': oldModuleId = 'module_1.2'; break;
        case 'MOD-1.3': oldModuleId = 'module_1.3'; break;
        case 'MOD-2.1': oldModuleId = 'module_2.1'; break;
        case 'MOD-2.2': oldModuleId = 'module_2.2'; break;
        case 'MOD-2.3': oldModuleId = 'module_2.3'; break;
        case 'MOD-3.1': oldModuleId = 'module_3.1'; break;
        case 'MOD-3.2': oldModuleId = 'module_3.2'; break;
        case 'MOD-3.3': oldModuleId = 'module_3.3'; break;
        case 'MOD-3.4': oldModuleId = 'module_3.4'; break;
      }
      
      if (oldModuleId) {
        moduleMapping[oldModuleId] = module._id;
        console.log(`✅ Found module mapping: ${oldModuleId} → ${module._id} (${module.name})`);
      }
    }

    console.log('\n🔄 Updating lessons...');

    // Update lessons with correct moduleId references
    let updateCount = 0;
    
    for (const [oldModuleId, newModuleId] of Object.entries(moduleMapping)) {
      if (newModuleId) {
        const result = await Lesson.updateMany(
          { moduleId: oldModuleId },
          { moduleId: newModuleId }
        );
        console.log(`✅ Updated ${result.modifiedCount} lessons from ${oldModuleId} to ${newModuleId}`);
        updateCount += result.modifiedCount;
      }
    }

    console.log(`\n🎉 Total lessons updated: ${updateCount}`);

    // Verify the fix
    console.log('\n🔍 Verification:');
    for (const module of modules) {
      const lessons = await Lesson.find({ moduleId: module._id });
      console.log(`📚 ${module.name}: ${lessons.length} lessons`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixLessonModuleIds();