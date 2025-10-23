const mongoose = require('mongoose');

const labChallengeSchema = new mongoose.Schema({
  challengeId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['video', 'image', 'audio'],
    required: true
  },
  isDeepfake: {
    type: Boolean,
    required: true
  },
  artifacts: [{
    type: String,
    description: String
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 10
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: false });

const labSchema = new mongoose.Schema({
  labId: {
    type: String,
    required: true,
    unique: true
  },
  moduleId: {
    type: String,
    ref: 'Module',
    required: true
    },
  lessonId: {
    type: String,
    ref: 'Lesson'
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
  labType: {
    type: String,
    enum: ['visual_detection', 'audio_detection', 'multi_modal', 'tool_practice'],
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number, // in minutes
    default: null
  },
  passingScore: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 3
  },
  challenges: [labChallengeSchema],
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
labSchema.index({ moduleId: 1 });
labSchema.index({ lessonId: 1 });
labSchema.index({ status: 1 });

module.exports = mongoose.model('Lab', labSchema);
