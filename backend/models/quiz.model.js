const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'multiple_select', 'short_answer'],
    default: 'multiple_choice'
  },
  options: [{
    optionId: String,
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String, // For short answer questions
  explanation: String,
  points: {
    type: Number,
    default: 1
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  moduleId: {
    type: String,
    ref: 'Module',
    index: true
  },
  lessonId: {
    type: String,
    ref: 'Lesson',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  quizType: {
    type: String,
    enum: ['knowledge_check', 'module_quiz', 'level_assessment', 'practice'],
    default: 'knowledge_check'
  },
  timeLimit: {
    type: Number, // in minutes
    default: null
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 3 // -1 for unlimited
  },
  showFeedback: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: true
  },
  questions: [quizQuestionSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ moduleId: 1 });
quizSchema.index({ lessonId: 1 });
quizSchema.index({ status: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
