const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../models/content.model');
const Quiz = require('../models/quiz.model');

const connect = async () => {
  try {
    const c = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected:', c.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connect error:', err.message);
    process.exit(1);
  }
};

const main = async () => {
  await connect();

  try {
  // Find all content items that reference a quizId (non-empty)
  const items = await Content.find({ type: 'quiz', quizId: { $exists: true, $nin: ['', null] } });
    console.log(`Found ${items.length} quiz content items with quizId`);

    const created = [];

    for (const item of items) {
      const qid = String(item.quizId);
      const existing = await Quiz.findOne({ quizId: qid });
      if (existing) continue;

      // Create a minimal quiz structure
      const quiz = new Quiz({
        quizId: qid,
        moduleId: null,
        lessonId: item.lessonId || null,
        title: item.title || `Auto-generated quiz ${qid}`,
        description: item.description || '',
        timeLimit: item.duration ? item.duration * 60 : 600,
        passingScore: item.passingScore || 60,
        attempts: 3,
        questions: [
          {
            questionId: `${qid}_q1`,
            questionType: 'multiple_choice',
            questionText: item.title ? `Question for ${item.title}` : 'Auto-generated question',
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

      await quiz.save();
      created.push(qid);
      console.log(`Created Quiz for quizId=${qid}`);
    }

    console.log(`\nCreated ${created.length} Quiz documents.`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating quizzes for content quizIds:', err);
    process.exit(1);
  }
};

main();
