const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true
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
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['completion', 'achievement', 'streak', 'mastery', 'special'],
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['track_completion', 'module_completion', 'quiz_score', 'lab_score', 'streak', 'total_xp', 'lessons_completed', 'perfect_score', 'time_based', 'custom'],
      required: true
    },
    value: mongoose.Schema.Types.Mixed, // Could be number, string, or object
    description: String
  },
  xpReward: {
    type: Number,
    default: 100
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeId: {
    type: String,
    ref: 'Badge',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number, // For badges that can be earned multiple times
    default: 1
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate badges
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

module.exports = { Badge, UserBadge };
