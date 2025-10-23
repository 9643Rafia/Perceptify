const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../models/content.model');
const Quiz = require('../models/quiz.model');
const Lesson = require('../models/lesson.model');

const connect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected:', conn.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const normalizeCandidates = (c) => {
  const candidates = [];
  if (c.contentId) candidates.push('quiz_' + String(c.contentId).replace(/^CNT-/, ''));
  if (c.lessonId) {
    candidates.push(String(c.lessonId));
    candidates.push(String(c.lessonId).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_'));
  }
  if (c.title) {
    const slug = String(c.title).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (slug) candidates.push('quiz_' + slug);
  }
  return [...new Set(candidates)];
};

const main = async () => {
  await connect();
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node populateQuizIdsForLesson.js <lessonId|LES-...>');
    process.exit(1);
  }

  // Find lesson
  const lesson = await Lesson.findOne({ _id: target }) || await Lesson.findOne({ lessonId: target }) || await Lesson.findOne({ lessonId: target.toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_') });
  if (!lesson) {
    console.error('Lesson not found for', target);
    process.exit(1);
  }

  const possibleLessonIds = [String(lesson._id)];
  if (lesson.lessonId) {
    possibleLessonIds.push(String(lesson.lessonId));
    possibleLessonIds.push(String(lesson.lessonId).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_'));
  }

  console.log('Populating quizId for quiz content items for lesson:', String(lesson._id), 'variants:', possibleLessonIds);

  const missing = await Content.find({ type: 'quiz', lessonId: { $in: possibleLessonIds }, $or: [ { quizId: { $exists: false } }, { quizId: null }, { quizId: '' } ] });
  console.log('Found', missing.length, 'quiz content items missing quizId');

  let updatedCount = 0;
  for (const c of missing) {
    const candidates = normalizeCandidates(c);
    let found = null;
    for (const cand of candidates) {
      const q = await Quiz.findOne({ quizId: cand });
      if (q) { found = q; break; }
    }
    if (found) {
      await Content.updateOne({ _id: c._id }, { $set: { quizId: found.quizId } });
      console.log(`Updated ${c.contentId || c._id} -> quizId ${found.quizId}`);
      updatedCount++;
    } else {
      console.log(`No matching Quiz found for content ${c.contentId || c._id} (candidates: ${candidates.join(', ')})`);
    }
  }

  console.log(`Done. Updated ${updatedCount} content items.`);
  process.exit(0);
};

main();
