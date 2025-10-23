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

const main = async () => {
  await connect();
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node inspectLessonQuizzes.js <lessonId|lesson_external>');
    process.exit(1);
  }

  // Load lesson document to obtain contentItems and lesson.lessonId
  const lesson = await Lesson.findOne({ _id: target }) || await Lesson.findOne({ lessonId: target }) || await Lesson.findOne({ lessonId: target.toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_') });
  if (!lesson) {
    console.log('No Lesson document found for', target);
  } else {
    console.log('Lesson found:', String(lesson._id), 'lessonId:', lesson.lessonId);
  }

  // Build possible lessonId variants (same as controller)
  const possibleLessonIds = [];
  if (lesson) {
    possibleLessonIds.push(String(lesson._id));
    if (lesson.lessonId) {
      possibleLessonIds.push(String(lesson.lessonId));
      const normalized = String(lesson.lessonId).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_');
      if (!possibleLessonIds.includes(normalized)) possibleLessonIds.push(normalized);
    }
  } else {
    possibleLessonIds.push(String(target));
  }

  // Build contentQueryOr (include contentIds from lesson.contentItems if present)
  const contentQueryOr = [];
  if (possibleLessonIds.length > 0) contentQueryOr.push({ lessonId: { $in: possibleLessonIds } });
  if (lesson && Array.isArray(lesson.contentItems) && lesson.contentItems.length > 0) {
    contentQueryOr.push({ contentId: { $in: lesson.contentItems } });
    const possibleObjectIds = lesson.contentItems.filter(ci => /^[0-9a-fA-F]{24}$/.test(ci));
    if (possibleObjectIds.length > 0) contentQueryOr.push({ _id: { $in: possibleObjectIds } });
  }

  const queryObj = { $and: [ { $or: contentQueryOr }, { status: 'active' } ] };
  console.log('Querying Content with:', JSON.stringify(queryObj));

  const contents = await Content.find(queryObj).sort({ order: 1 });
  console.log(`Found ${contents.length} content items (query matched)`);

  for (const c of contents) {
    console.log('---');
    console.log('Content _id:', String(c._id));
    console.log('contentId:', c.contentId, 'type:', c.type);
    console.log('quizId (field):', c.quizId);

    if (c.quizId) {
      const q = await Quiz.findOne({ quizId: String(c.quizId) });
      if (q) {
        console.log('-> Quiz found by quizId:', q.quizId, '| _id:', String(q._id));
        // Print some quiz fields to inspect
        console.log('   title:', q.title);
        console.log('   questions.length:', Array.isArray(q.questions) ? q.questions.length : 0);
      } else {
        // Try find by MongoDB _id
        try {
          const byId = await Quiz.findById(String(c.quizId));
          if (byId) {
            console.log('-> Quiz found by _id:', String(byId._id), '| quizId field:', byId.quizId);
          } else {
            console.log('-> No Quiz found for quizId or _id:', c.quizId);
          }
        } catch (e) {
          console.log('-> No Quiz found for quizId:', c.quizId, '(and not a valid ObjectId)');
        }
      }
    }
  }

  // Also list any Quiz docs that have lessonId equal to target variants
  const quizzesByLesson = await Quiz.find({ lessonId: { $in: possibleLessonIds } });
  console.log('\nQuizzes with lessonId matching those variants:', quizzesByLesson.length);
  for (const q of quizzesByLesson) {
    console.log('-', 'quizId:', q.quizId, '| _id:', String(q._id), '| title:', q.title, '| questions:', q.questions?.length || 0);
  }

  process.exit(0);
};

main();
