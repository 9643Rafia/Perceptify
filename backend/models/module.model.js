const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: true,
    unique: true
  },
  trackId: {
    type: String,

    
    ref: 'Track',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  estimatedDuration: {
    type: String,
    required: true
  },
  lessonCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  prerequisites: [{
    type: String,
    ref: 'Module'
  }],
  learningObjectives: [{
    type: String
  }],
  quizId: {
    type: String,
    ref: 'Quiz',
    default: null
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  requiresLabCompletion: {
    type: Boolean,
    default: false
  },
  requiresCapstone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
moduleSchema.index({ trackId: 1, order: 1 });
moduleSchema.index({ status: 1 });

// Virtual for lessons
moduleSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'moduleId'
});

module.exports = mongoose.model('Module', moduleSchema);
