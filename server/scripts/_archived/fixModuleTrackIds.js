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

const fixModuleTrackIds = async () => {
  console.log('🔧 Fixing module trackId references...\n');

  try {
    await connectDB();

    // Create mapping of old trackId to new ObjectId
    const trackMapping = {
      'track_beginner': null,
      'track_intermediate': null,
      'track_advanced': null
    };

    // Get tracks and build mapping
    const beginnerTrack = await Track.findOne({ trackId: 'TRACK-001' });
    const intermediateTrack = await Track.findOne({ trackId: 'TRACK-002' });
    const advancedTrack = await Track.findOne({ trackId: 'TRACK-003' });

    if (beginnerTrack) {
      trackMapping['track_beginner'] = beginnerTrack._id;
      console.log(`✅ Found Beginner Track: ${beginnerTrack._id}`);
    }
    if (intermediateTrack) {
      trackMapping['track_intermediate'] = intermediateTrack._id;
      console.log(`✅ Found Intermediate Track: ${intermediateTrack._id}`);
    }
    if (advancedTrack) {
      trackMapping['track_advanced'] = advancedTrack._id;
      console.log(`✅ Found Advanced Track: ${advancedTrack._id}`);
    }

    console.log('\n� Updating modules...');

    // Update modules with correct trackId references
    let updateCount = 0;
    
    for (const [oldTrackId, newTrackId] of Object.entries(trackMapping)) {
      if (newTrackId) {
        const result = await Module.updateMany(
          { trackId: oldTrackId },
          { trackId: newTrackId }
        );
        console.log(`✅ Updated ${result.modifiedCount} modules from ${oldTrackId} to ${newTrackId}`);
        updateCount += result.modifiedCount;
      }
    }

    console.log(`\n🎉 Total modules updated: ${updateCount}`);

    // Verify the fix
    console.log('\n� Verification:');
    const tracks = await Track.find({}).sort({ order: 1 });
    
    for (const track of tracks) {
      const modules = await Module.find({ trackId: track._id });
      console.log(`📊 ${track.name}: ${modules.length} modules`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run the script
fixModuleTrackIds();
