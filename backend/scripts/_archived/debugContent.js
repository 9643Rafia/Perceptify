const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Content = require('../models/content.model');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for debug');

    const lessonObjectId = process.argv[2];
    const lessonExternalId = process.argv[3];
    const normalized = lessonExternalId ? String(lessonExternalId).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_') : null;

    const queries = [];
    if (lessonObjectId) queries.push({ lessonId: String(lessonObjectId) });
    if (lessonExternalId) queries.push({ lessonId: String(lessonExternalId) });
    if (normalized) queries.push({ lessonId: normalized });

    console.log('Debug queries:', queries);

    const docs = await Content.find({ $or: queries }).lean();
    console.log('Found', docs.length, 'content docs:');
    docs.forEach(d => console.log('-', d.contentId, d._id, d.lessonId, d.title, d.url));

    if (docs.length === 0) {
      console.log('No docs matched. Listing first 10 content documents for inspection:');
      const sample = await Content.find().limit(10).lean();
      sample.forEach(d => console.log('-', d.contentId, d._id, d.lessonId, d.title));
    }

    process.exit(0);
  } catch (err) {
    console.error('Debug error:', err.message);
    process.exit(1);
  }
};

run();
