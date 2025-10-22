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

const normalizeQuizId = (content) => {
  // Prefer explicit quizId on content, fall back to contentId or derived id
  if (content.quizId) return String(content.quizId);
  if (content.contentId) return String(content.contentId).replace(/^CNT-/, 'quiz_');
  return `quiz_${content._id}`;
};

const main = async () => {
  await connect();

  try {
    const quizContents = await Content.find({ type: 'quiz' });
    console.log(`Found ${quizContents.length} content items of type 'quiz'`);

    const created = [];
    const skipped = [];

    for (const content of quizContents) {
      const quizId = normalizeQuizId(content);

      const existing = await Quiz.findOne({ quizId });
      if (existing) {
        skipped.push(quizId);
        continue;
      }

      // Try to derive lesson -> module relationship
      let moduleId = null;
      if (content.lessonId) {
        const lid = String(content.lessonId);
        const orClauses = [];

        // If it looks like an ObjectId, search by _id
        if (/^[0-9a-fA-F]{24}$/.test(lid)) {
          orClauses.push({ _id: lid });
        }

        // Add exact lessonId match
        orClauses.push({ lessonId: lid });

        // Normalized variants (legacy formats)
        const normalized1 = lid.toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_');
        if (normalized1 !== lid) orClauses.push({ lessonId: normalized1 });

        const normalized2 = lid.replace(/^lesson[-_]?/i, 'lesson_');
        if (normalized2 !== lid) orClauses.push({ lessonId: normalized2 });

        // Perform the query using $or; guard against casting errors
        let lesson = null;
        try {
          lesson = await Lesson.findOne({ $or: orClauses });
        } catch (e) {
          console.warn('Warning: lesson lookup cast error for', lid, '-', e.message);
          // fallback: try simple lessonId match
          lesson = await Lesson.findOne({ lessonId: lid });
        }

        if (lesson) {
          const module = await Module.findOne({ _id: lesson.moduleId });
          if (module) moduleId = module._id;
        }
      }

      // Provide at least one default question so questions.questionId is not null
      const defaultQuestionId = `${quizId}_q1`;
      const quizDoc = new Quiz({
        quizId,
        moduleId: moduleId || null,
        lessonId: content.lessonId || null,
        title: content.title || `Auto-quiz for ${quizId}`,
        description: content.description || '',
        timeLimit: content.duration ? content.duration * 60 : 600,
        passingScore: content.passingScore || content.metadata?.passingScore || 60,
        attempts: content.metadata?.attempts || 3,
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

      try {
        await quizDoc.save();
        // Write back quizId to the content document so front-end can pick it up
        try {
          await Content.updateOne({ _id: content._id }, { $set: { quizId: quizId } });
          console.log(`Updated Content ${content.contentId || content._id} with quizId ${quizId}`);
        } catch (updErr) {
          console.warn('Warning: failed to update Content with quizId for', content.contentId || content._id, updErr.message || updErr);
        }
        created.push(quizId);
        console.log(`Created quiz ${quizId} (from content ${content.contentId || content._id})`);
      } catch (saveErr) {
        // If duplicate key error (race or index issue), log and continue
        if (saveErr && saveErr.code === 11000) {
          console.warn(`Duplicate key when saving ${quizId}, skipping:`, saveErr.message);
          skipped.push(quizId + ' (dup)');
          continue;
        }
        throw saveErr;
      }
    }

    console.log(`\nCreated: ${created.length} quizzes`);
    if (skipped.length) console.log(`Skipped existing: ${skipped.length}`, skipped.slice(0,50));

    // Second pass: ensure Content documents have quizId populated when possible
    console.log('\n🔧 Ensuring Content documents have quizId populated...');
    const missingQuizIdContents = await Content.find({ type: 'quiz', $or: [ { quizId: { $exists: false } }, { quizId: null }, { quizId: '' } ] });
    console.log(`Found ${missingQuizIdContents.length} content items missing quizId`);

    const updatedContents = [];
    const unresolved = [];

    for (const c of missingQuizIdContents) {
      const candidates = [];
      if (c.contentId) {
        // e.g. CNT-1.1.1-Q1 -> quiz_1.1.1-Q1
        candidates.push('quiz_' + String(c.contentId).replace(/^CNT-/, ''));
      }
      if (c.lessonId) {
        // try to find quizzes with lessonId equal to this lessonId (various formats)
        candidates.push(String(c.lessonId));
        candidates.push(String(c.lessonId).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_'));
      }
      if (c.title) {
        // last resort: slugify title to match possible quizId naming (very heuristic)
        const slug = String(c.title).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (slug) candidates.push('quiz_' + slug);
      }

      let found = null;
      for (const cand of candidates) {
        if (!cand) continue;
        const q = await Quiz.findOne({ quizId: cand });
        if (q) { found = q; break; }
      }

      // fallback: try quiz with lessonId field matching this content's lessonId
      if (!found && c.lessonId) {
        const q2 = await Quiz.findOne({ lessonId: c.lessonId });
        if (q2) found = q2;
      }

      if (found) {
        try {
          await Content.updateOne({ _id: c._id }, { $set: { quizId: found.quizId } });
          updatedContents.push({ contentId: c.contentId || c._id, quizId: found.quizId });
          console.log(`Updated content ${c.contentId || c._id} -> quizId ${found.quizId}`);
        } catch (uErr) {
          console.warn('Failed to update content with quizId for', c.contentId || c._id, uErr.message || uErr);
        }
      } else {
        unresolved.push(c.contentId || c._id);
        console.log(`Could not resolve quiz for content ${c.contentId || c._id} (candidates: ${candidates.join(', ')})`);
      }
    }

    console.log(`\nUpdated ${updatedContents.length} Content documents with quizId`);
    if (unresolved.length) console.log(`Could not resolve quizId for ${unresolved.length} content items`, unresolved.slice(0,50));

    process.exit(0);
  } catch (err) {
    console.error('Error populating quizzes from content:', err);
    process.exit(1);
  }
};

main();
