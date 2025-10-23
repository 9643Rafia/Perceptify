const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  lessonId: {
    type: String,
    required: true,
    unique: true
  },
  moduleId: {
    type: String,
    ref: 'Module',
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
    type: Number,
    required: true
  },
  durationType: {
    type: String,
    enum: ['minutes', 'hours', 'days', 'weeks'],
    default: 'minutes'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  contentItems: [{
    type: String,
    ref: 'Content'
  }],
  learningOutcomes: [{
    type: String
  }],
  prerequisites: [{
    type: String,
    ref: 'Lesson'
  }],
  isLab: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
lessonSchema.index({ moduleId: 1, order: 1 });
lessonSchema.index({ status: 1 });

// Virtual for content
lessonSchema.virtual('content', {
  ref: 'Content',
  localField: '_id',
  foreignField: 'lessonId'
});

module.exports = mongoose.model('Lesson', lessonSchema);
