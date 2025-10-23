const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Track = require('../models/track.model');
const Module = require('../models/module.model');

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

const debugRelationships = async () => {
  console.log('🔍 Debugging track-module relationships...\n');

  try {
    await connectDB();

    // Get all tracks
    const tracks = await Track.find({}).sort({ order: 1 });
    console.log('📊 Found tracks:', tracks.length);

    for (const track of tracks) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 Track:', track.name);
      console.log('   _id:', track._id);
      console.log('   trackId:', track.trackId);
      
      // Try both ways to find modules
      const modulesByTrackId = await Module.find({ trackId: track.trackId });
      const modulesByTrackObjectId = await Module.find({ trackId: track._id });
      
      console.log('   Modules found by trackId (' + track.trackId + '):', modulesByTrackId.length);
      console.log('   Modules found by _id (' + track._id + '):', modulesByTrackObjectId.length);
      
      if (modulesByTrackObjectId.length > 0) {
        console.log('   ✅ Modules found using _id:');
        modulesByTrackObjectId.forEach(mod => {
          console.log(`     - ${mod.name} (${mod._id})`);
        });
      }
      
      if (modulesByTrackId.length > 0) {
        console.log('   ✅ Modules found using trackId:');
        modulesByTrackId.forEach(mod => {
          console.log(`     - ${mod.name} (${mod._id})`);
        });
      }
      
      if (modulesByTrackId.length === 0 && modulesByTrackObjectId.length === 0) {
        console.log('   ❌ No modules found with either method');
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 All modules in database:');
    const allModules = await Module.find({});
    allModules.forEach(mod => {
      console.log(`   - ${mod.name} (trackId: ${mod.trackId})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

debugRelationships();