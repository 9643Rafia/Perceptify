const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trackId: {
    type: String,
    ref: 'Track',
    required: true
  },
  certificateType: {
    type: String,
    enum: ['track_completion', 'course_completion', 'mastery'],
    default: 'track_completion'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  achievements: {
    totalScore: Number,
    modulesCompleted: Number,
    quizzesPassed: Number,
    labsCompleted: Number,
    totalXPEarned: Number,
    badgesEarned: Number
  },
  metadata: {
    completionTime: Number, // in hours
    averageScore: Number,
    rank: String // e.g., "Top 10%"
  },
  isValid: {
    type: Boolean,
    default: true
  },
  pdfUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate unique certificate ID and verification code before saving
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    this.certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  if (!this.verificationCode) {
    this.verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  next();
});

// Indexes
certificateSchema.index({ userId: 1, trackId: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
