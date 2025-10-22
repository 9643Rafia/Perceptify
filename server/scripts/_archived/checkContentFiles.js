const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../models/content.model');

const lessonId = process.argv[2] || '68f8017586c82c0ddd615555';

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const contents = await Content.find({ lessonId }).sort({ order: 1 });
    if (!contents || contents.length === 0) {
      console.log('No content items found for lessonId', lessonId);
      process.exit(0);
    }

    console.log(`Found ${contents.length} content items for lesson ${lessonId}:`);
    for (const c of contents) {
      console.log('---');
      console.log('id:', c._id.toString());
      console.log('title:', c.title);
      console.log('type:', c.type);
      console.log('url:', c.url);
      if (c.type === 'video' && c.url) {
        // Normalize URL to a path under public
        // Remove leading protocol and host if present
        let urlPath = c.url.replace(/^https?:\/\/[0-9A-Za-z:\.]+/, '');
        // Remove leading slash
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