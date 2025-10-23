const mongoose = require('mongoose');

const completionCriteriaSchema = new mongoose.Schema({
  minimumScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  requiredModules: [{
    type: String,
    ref: 'Module'
  }],
  assessmentRequired: {
    type: Boolean,
    default: false
  },
  practicalRequired: {
    type: Boolean,
    default: false
  },
  capstoneRequired: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const trackSchema = new mongoose.Schema({
  trackId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 1
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
  icon: {
    type: String,
    default: '📚'
  },
  prerequisites: [{
    type: String,
    ref: 'Track'
  }],
  estimatedDuration: {
    type: String,
    required: true
  },
  moduleCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  order: {
    type: Number,
    required: true
  },
  completionCriteria: completionCriteriaSchema
}, {
  timestamps: true
});

// Index for efficient querying
trackSchema.index({ status: 1, order: 1 });
trackSchema.index({ level: 1 });

// Virtual for modules
trackSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'trackId'
});

module.exports = mongoose.model('Track', trackSchema);
