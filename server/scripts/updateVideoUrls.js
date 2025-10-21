const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

// Update video URLs
const updateVideoUrls = async () => {
  console.log('🎥 Updating video URLs to use sample-video.mp4...\n');

  try {
    await connectDB();

    // Find all video content
    const videoContent = await Content.find({ type: 'video' });

    console.log(`Found ${videoContent.length} video content items\n`);

    let updateCount = 0;

    for (const content of videoContent) {
      const oldUrl = content.url;
      const newUrl = '/media/videos/sample-video.mp4';

      if (oldUrl !== newUrl) {
        content.url = newUrl;
        await content.save();
        console.log(`✅ Updated: "${content.title}"`);
        console.log(`   Old URL: ${oldUrl}`);
        console.log(`   New URL: ${newUrl}\n`);
        updateCount++;
      } else {
        console.log(`✓ Already correct: "${content.title}"\n`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Video URL update completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   • Total video content items: ${videoContent.length}`);
    console.log(`   • URLs updated: ${updateCount}`);
    console.log(`\n🎬 All videos now point to: /media/videos/sample-video.mp4`);
    console.log(`\n📁 Make sure your file exists at: perceptify/public/media/videos/sample-video.mp4\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating video URLs:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
updateVideoUrls();
