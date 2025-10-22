const mongoose = require('mongoose');
const Module = require('../../models/module.model');
const Quiz = require('../../models/quiz.model');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('DB connect error:', err.message);
    process.exit(1);
  }
};

(async () => {
  await connect();

  try {
    const modules = await Module.find({});
    console.log(`Found ${modules.length} modules with quizId`);

    const created = [];

    for (const mod of modules) {
      if (!mod.quizId) continue; // skip modules without quizId
      const existing = await Quiz.findOne({ quizId: mod.quizId });
      if (existing) continue;

      const quiz = new Quiz({
        quizId: mod.quizId,
        moduleId: mod._id,
        title: `${mod.name} Assessment`,
        description: `Auto-generated demo quiz for module ${mod.name}`,
        timeLimit: 1800,
        passingScore: mod.passingScore || 70,
        attempts: mod.quizAttemptsAllowed || 3,
        questions: [
          {
            questionId: `${mod.quizId}_q1`,
            questionType: 'multiple_choice',
            questionText: `Which statement best describes ${mod.name}?`,
            points: 10,
            order: 1,
            options: [
              { optionId: 'a', text: 'Correct (demo)', isCorrect: true },
              { optionId: 'b', text: 'Incorrect 1', isCorrect: false },
              { optionId: 'c', text: 'Incorrect 2', isCorrect: false },
              { optionId: 'd', text: 'Incorrect 3', isCorrect: false }
            ],
            explanation: 'Demo explanation.'
          },
          {
            questionId: `${mod.quizId}_q2`,
            questionType: 'true_false',
            questionText: `True or False: ${mod.name} is covered in this module.`,
            points: 10,
            order: 2,
            options: [
              { optionId: 'true', text: 'True', isCorrect: true },
              { optionId: 'false', text: 'False', isCorrect: false }
            ],
            explanation: 'Demo explanation.'
          }
        ],
        status: 'active'
      });

      await quiz.save();
      created.push(quiz.quizId);
      console.log(`Created quiz ${quiz.quizId} for module ${mod.name}`);
    }

    console.log(`
Created ${created.length} quizzes:`, created);
    process.exit(0);
  } catch (err) {
    console.error('Error creating quizzes:', err);
    process.exit(1);
  }
})();