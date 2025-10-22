const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../models/content.model');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const contents = await Content.find({ type: 'video', status: 'active' }).sort({ createdAt: 1 });
    if (!contents || contents.length === 0) {
      console.log('No video content items found');
      process.exit(0);
    }

    console.log(`Found ${contents.length} video content items:`);
    for (const c of contents) {
      console.log('---');
      console.log('id:', c._id.toString());
      console.log('contentId:', c.contentId);
      console.log('lessonId:', c.lessonId);
      console.log('title:', c.title);
      console.log('url:', c.url);
      if (c.url) {
        // Normalize URL to a path under public
        let urlPath = c.url.replace(/^https?:\/\/[0-9A-Za-z:\.]+/, '');
        if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);
        const filePath = path.join(__dirname, '..', '..', 'public', urlPath);
        const exists = fs.existsSync(filePath);
        console.log('expected file path:', filePath);
        console.log('file exists:', exists);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();