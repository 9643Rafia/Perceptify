const mongoose = require('mongoose');
const Quiz = require('../../models/quiz.model');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

(async () => {
  try {
    await connect();
    const existing = await Quiz.findOne({ quizId: 'quiz_1.1.1' });
    if (existing) {
      console.log('Quiz already exists: quiz_1.1.1');
      process.exit(0);
    }

    const quiz = new Quiz({
      quizId: 'quiz_1.1.1',
      moduleId: null, // will be left null for demo
      title: 'Lesson 1.1.1 Mini-Quiz',
      description: 'Mini-quiz for Lesson 1.1.1',
      timeLimit: 600,
      passingScore: 60,
      attempts: 3,
      questions: [
        {
          questionId: 'quiz_1.1.1_q1',
          questionType: 'multiple_choice',
          questionText: 'Which term best describes synthetic media created by AI?',
          points: 10,
          order: 1,
          options: [
            { optionId: 'a', text: 'Deepfake', isCorrect: true },
            { optionId: 'b', text: 'Hoax', isCorrect: false },
            { optionId: 'c', text: 'Replica', isCorrect: false },
            { optionId: 'd', text: 'Clone', isCorrect: false }
          ],
          explanation: 'Deepfake is the commonly used term.'
        },
        {
          questionId: 'quiz_1.1.1_q2',
          questionType: 'true_false',
          questionText: 'True or False: Voice cloning is unrelated to deepfakes.',
          points: 10,
          order: 2,
          options: [
            { optionId: 'true', text: 'True', isCorrect: false },
            { optionId: 'false', text: 'False', isCorrect: true }
          ],
          explanation: 'Voice cloning is a form of deepfake.'
        }
      ],
      status: 'active'
    });

    await quiz.save();
    console.log('Created demo quiz: quiz_1.1.1');
    process.exit(0);
  } catch (err) {
    console.error('Error creating demo quiz:', err);
    process.exit(1);
  }
})();