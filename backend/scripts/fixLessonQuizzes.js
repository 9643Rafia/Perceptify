const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../models/content.model');
const Quiz = require('../models/quiz.model');
const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');

const connect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected:', conn.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const normalizeQuizIdFromContent = (content) => {
  if (content.quizId) return String(content.quizId);
  if (content.contentId) return String(content.contentId).replace(/^CNT-/, 'quiz_');
  return `quiz_${content._id}`;
};

const ensureQuizExists = async (quizId, content) => {
  const existing = await Quiz.findOne({ quizId });
  if (existing) return { created: false, quiz: existing };

  // try to link moduleId via lesson if possible
  let moduleId = null;
  if (content.lessonId) {
    const lid = String(content.lessonId);
    const or = [];
    if (/^[0-9a-fA-F]{24}$/.test(lid)) or.push({ _id: lid });
    or.push({ lessonId: lid });
    or.push({ lessonId: lid.toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_') });
    or.push({ lessonId: lid.replace(/^lesson[-_]?/i, 'lesson_') });
    let lesson = null;
    try { lesson = await Lesson.findOne({ $or: or }); } catch (e) { lesson = await Lesson.findOne({ lessonId: lid }); }
    if (lesson) {
      const m = await Module.findOne({ _id: lesson.moduleId });
      if (m) moduleId = m._id;
    }
  }

  const defaultQuestionId = `${quizId}_q1`;
  const quizDoc = new Quiz({
    quizId,
    moduleId: moduleId || null,
    lessonId: content.lessonId || null,
    title: content.title || `Auto-quiz ${quizId}`,
    description: content.description || '',
    timeLimit: content.duration ? content.duration * 60 : 600,
    passingScore: content.passingScore || 60,
    attempts: 3,
    questions: [
      {
        questionId: defaultQuestionId,
        questionType: 'multiple_choice',
        questionText: content.title ? `Question for ${content.title}` : 'Auto-generated question',
        points: 1,
        order: 1,
        options: [
          { optionId: 'a', text: 'Option A', isCorrect: true },
          { optionId: 'b', text: 'Option B', isCorrect: false }
        ]
      }
    ],
    status: 'active'
  });

  await quizDoc.save();
  return { created: true, quiz: quizDoc };
};

const main = async () => {
  await connect();

  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node fixLessonQuizzes.js <lessonId|lesson_LEGACY_ID>');
    process.exit(1);
  }

  // Build possible lessonId matches the same way controllers do
  const possibleLessonIds = [target];
  if (/^[0-9a-fA-F]{24}$/.test(target)) possibleLessonIds.unshift(target);
  // normalized
  const normalized = String(target).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_');
  if (!possibleLessonIds.includes(normalized)) possibleLessonIds.push(normalized);

  console.log('Target lesson identifiers:', possibleLessonIds);

  // Find content for that lesson
  const contentItems = await Content.find({ type: 'quiz', lessonId: { $in: possibleLessonIds } });
  console.log(`Found ${contentItems.length} quiz content items for lesson ${target}`);

  const updated = [];
  const createdQuizzes = [];

  for (const c of contentItems) {
    const qid = normalizeQuizIdFromContent(c);

    // Ensure Quiz exists
    try {
      const { created } = await ensureQuizExists(qid, c);
      if (created) {
        createdQuizzes.push(qid);
        console.log(`Created quiz ${qid}`);
      }
    } catch (e) {
      console.error('Failed to create quiz for', qid, e.message || e);
    }

    // Ensure Content.quizId is set
    if (!c.quizId || String(c.quizId) !== String(qid)) {
      try {
        await Content.updateOne({ _id: c._id }, { $set: { quizId: qid } });
        updated.push({ contentId: c.contentId || c._id, quizId: qid });
        console.log(`Updated content ${c.contentId || c._id} -> quizId ${qid}`);
      } catch (uerr) {
        console.warn('Failed to update content', c.contentId || c._id, uerr.message || uerr);
      }
    } else {
      console.log(`Content ${c.contentId || c._id} already has quizId ${qid}`);
    }
  }

  console.log(`\nSummary: created ${createdQuizzes.length} quizzes, updated ${updated.length} content items.`);
  process.exit(0);
};

main();
