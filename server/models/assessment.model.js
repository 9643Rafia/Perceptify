const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  answers: {
    heardAboutDeepfakes: {
      type: String,
      enum: ['Yes', 'No', 'Not Sure'],
      required: true
    },
    knowWhatDeepfakesUsedFor: {
      type: String,
      enum: ['Yes, I understand', 'I have a basic idea', 'No idea'],
      required: true
    },
    canIdentifyDeepfake: {
      type: String,
      enum: ['Yes, confidently', 'Maybe sometimes', 'No, not at all'],
      required: true
    },
    awareOfRisks: {
      type: String,
      enum: ['Very aware', 'Somewhat aware', 'Not aware'],
      required: true
    },
    triedToDetect: {
      type: String,
      enum: ['Yes, multiple times', 'Once or twice', 'Never'],
      required: true
    }
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate score and level based on answers
assessmentSchema.methods.calculateScore = function() {
  let score = 0;
  const answers = this.answers;

  // Question 1: Have you heard about deepfakes?
  if (answers.heardAboutDeepfakes === 'Yes') score += 20;
  else if (answers.heardAboutDeepfakes === 'Not Sure') score += 10;

  // Question 2: Do you know what deepfakes are used for?
  if (answers.knowWhatDeepfakesUsedFor === 'Yes, I understand') score += 20;
  else if (answers.knowWhatDeepfakesUsedFor === 'I have a basic idea') score += 10;

  // Question 3: Can you identify a deepfake?
  if (answers.canIdentifyDeepfake === 'Yes, confidently') score += 20;
  else if (answers.canIdentifyDeepfake === 'Maybe sometimes') score += 10;

  // Question 4: Awareness of risks
  if (answers.awareOfRisks === 'Very aware') score += 20;
  else if (answers.awareOfRisks === 'Somewhat aware') score += 10;

  // Question 5: Experience with detection
  if (answers.triedToDetect === 'Yes, multiple times') score += 20;
  else if (answers.triedToDetect === 'Once or twice') score += 10;

  this.score = score;

  // Determine level based on score
  if (score >= 70) {
    this.level = 'Advanced';
  } else if (score >= 40) {
    this.level = 'Intermediate';
  } else {
    this.level = 'Beginner';
  }

  return this.score;
};

// Index for efficient queries
// Note: We allow multiple null userId values for anonymous users
assessmentSchema.index({ userId: 1 });
assessmentSchema.index({ email: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
