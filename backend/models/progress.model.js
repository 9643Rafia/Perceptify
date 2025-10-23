const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: String,
    ref: 'Lesson',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastPosition: {
    type: Number, // for video/audio content
    default: 0
  },
  completedContentItems: [{
    type: String,
    ref: 'Content'
  }],
  startedAt: Date,
  completedAt: Date
}, { _id: false });

const moduleProgressSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    ref: 'Module',
    required: true
  },
  status: {
    type: String,
    enum: ['locked', 'unlocked', 'in_progress', 'completed'],
    default: 'locked'
  },
  lessonsProgress: [lessonProgressSchema],
  quizAttempts: [{
    attemptNumber: Number,
    score: Number,
    passed: Boolean,
    answers: [{
      questionId: String,
      selectedAnswer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      markedForReview: Boolean
    }],
    timeSpent: Number,
    completedAt: Date
  }],
  labAttempts: [{
    labId: String,
    attemptNumber: Number,
    score: Number,
    passed: Boolean,
    responses: [{
      challengeId: String,
      verdict: String,
      reasoning: String,
      isCorrect: Boolean,
      timeSpent: Number
    }],
    completedAt: Date
  }],
  bestQuizScore: {
    type: Number,
    default: 0
  },
  bestLabScore: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  completedAt: Date
}, { _id: false });

const trackProgressSchema = new mongoose.Schema({
  trackId: {
    type: String,
    ref: 'Track',
    required: true
  },
  status: {
    type: String,
    enum: ['locked', 'unlocked', 'in_progress', 'completed'],
    default: 'locked'
  },
  modulesProgress: [moduleProgressSchema],
  overallScore: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  completedAt: Date
}, { _id: false });

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentTrack: {
    type: String,
    ref: 'Track',
    default: null
  },
  currentModule: {
    type: String,
    ref: 'Module',
    default: null
  },
  currentLesson: {
    type: String,
    ref: 'Lesson',
    default: null
  },
  tracksProgress: [trackProgressSchema],
  totalXP: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streak: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
progressSchema.index({ userId: 1 });
progressSchema.index({ 'tracksProgress.trackId': 1 });
progressSchema.index({ totalXP: -1 }); // For leaderboard
progressSchema.index({ level: -1 });

// Method to update streak
progressSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActivity = this.streak.lastActivityDate;

  if (!lastActivity) {
    this.streak.currentStreak = 1;
    this.streak.lastActivityDate = now;
  } else {
    const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActivity === 0) {
      // Same day, no change
      return;
    } else if (daysSinceLastActivity === 1) {
      // Consecutive day
      this.streak.currentStreak += 1;
      this.streak.lastActivityDate = now;
    } else {
      // Streak broken
      this.streak.currentStreak = 1;
      this.streak.lastActivityDate = now;
    }

    // Update longest streak if needed
    if (this.streak.currentStreak > this.streak.longestStreak) {
      this.streak.longestStreak = this.streak.currentStreak;
    }
  }
};

// Method to add XP
progressSchema.methods.addXP = function(points) {
  this.totalXP += points;

  // Level up logic (every 1000 XP = 1 level)
  const newLevel = Math.floor(this.totalXP / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return true; // Leveled up
  }
  return false; // No level up
};

module.exports = mongoose.model('Progress', progressSchema);
