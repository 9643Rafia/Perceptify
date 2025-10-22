const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  contentId: {
    type: String,
    required: true,
    unique: true
  },
  lessonId: {
    type: String,
    ref: 'Lesson',
    required: true
  },
  type: {
    type: String,
    enum: [
      'video', 'reading', 'interactive', 'quiz', 'activity', 'lab', 'case_study',
      'discussion', 'code', 'markdown', 'media', 'resource', 'practical-exercise',
      'practical-test', 'scenario-based', 'real-video', 'face-swap', 'lip-sync',
      'de-aging', 'full-face', 'partial-face', 'high-quality-swap',
      'Deepfake - face swap', 'High-quality entertainment deepfake',
      'Cheapfake (not technically deepfake, but manipulated)',
      'Completely fabricated scenario', 'detailed-after-submission',
      'immediate-detailed'
    ],
    required: true
  },
  subType: {
    type: String,
    enum: [
      'article', 'timeline', 'diagram', 'gallery', 'case_study', 'scenario', 'forum', 'tool',
      'challenge', 'simulation', 'mini-quiz', 'audio-quiz', 'audio-samples', 'checklist',
      'code-demo', 'comparison', 'comprehensive-quiz', 'drag-drop', 'feedback-report',
      'framework', 'group-discussion', 'hands-on-lab', 'identification', 'image-analysis',
      'investigation', 'jupyter-notebook', 'knowledge-check', 'map', 'peer-review',
      'performance-report', 'practice', 'practice-quiz', 'reflection-quiz', 'survey',
      'technical-paper', 'tool-demo', 'tutorial', null
    ],
    default: null
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
  order: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  durationType: {
    type: String,
    enum: ['minutes', 'hours'],
    default: 'minutes'
  },
  url: {
    type: String,
    default: null
  },
  quizId: {
    type: String,
    default: null,
    index: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  transcriptUrl: {
    type: String,
    default: null
  },
  htmlContent: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
contentSchema.index({ lessonId: 1, order: 1 });
contentSchema.index({ type: 1 });
contentSchema.index({ status: 1 });

module.exports = mongoose.model('Content', contentSchema);
