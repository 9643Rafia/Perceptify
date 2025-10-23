const Assessment = require('../models/assessment.model');
const User = require('../models/user.model');

// @desc    Submit assessment quiz
// @route   POST /api/assessment/submit
// @access  Public (works for both authenticated and anonymous users)
exports.submitAssessment = async (req, res) => {
  try {
    const { name, email, answers } = req.body;
    const userId = req.user?._id; // Optional - may be null for anonymous users
    const isAuthenticated = !!req.user;

    // Validate required fields
    if (!name || !email || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate all answers are present
    const requiredAnswers = [
      'heardAboutDeepfakes',
      'knowWhatDeepfakesUsedFor',
      'canIdentifyDeepfake',
      'awareOfRisks',
      'triedToDetect'
    ];

    for (const answer of requiredAnswers) {
      if (!answers[answer]) {
        return res.status(400).json({
          success: false,
          message: `Missing answer for: ${answer}`
        });
      }
    }

    // Check if user already has an assessment
    let assessment;

    if (isAuthenticated && userId) {
      // For authenticated users: find by userId
      assessment = await Assessment.findOne({ userId });
    } else {
      // For anonymous users: find by email
      assessment = await Assessment.findOne({ email, userId: null });
    }

    if (assessment) {
      // Update existing assessment
      assessment.name = name;
      assessment.email = email;
      assessment.answers = answers;
      assessment.completedAt = Date.now();
      if (isAuthenticated && userId) {
        assessment.userId = userId; // Link to user if authenticated
      }
    } else {
      // Create new assessment
      assessment = new Assessment({
        userId: isAuthenticated ? userId : null,
        name,
        email,
        answers
      });
    }

    // Calculate score and level
    assessment.calculateScore();

    // Save to database
    await assessment.save();

    // Update user profile with learning level and score (only for authenticated users)
    if (isAuthenticated && userId) {
      const user = await User.findById(userId);
      if (user) {
        user.learningLevel = assessment.level;
        user.assessmentScore = assessment.score;
        user.assessmentCompleted = true;
        user.assessmentDate = Date.now();
        user.updatedAt = Date.now();
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        score: assessment.score,
        level: assessment.level,
        assessmentId: assessment._id,
        isAuthenticated
      }
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting assessment',
      error: error.message
    });
  }
};

// @desc    Get user's assessment
// @route   GET /api/assessment/me
// @access  Private
exports.getMyAssessment = async (req, res) => {
  try {
    const userId = req.user._id;

    const assessment = await Assessment.findOne({ userId });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'No assessment found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessment',
      error: error.message
    });
  }
};

// @desc    Check if user has completed assessment
// @route   GET /api/assessment/check
// @access  Private
exports.checkAssessment = async (req, res) => {
  try {
    const userId = req.user._id;

    const assessment = await Assessment.findOne({ userId });

    res.status(200).json({
      success: true,
      hasCompleted: !!assessment,
      data: assessment ? {
        score: assessment.score,
        level: assessment.level,
        completedAt: assessment.completedAt
      } : null
    });
  } catch (error) {
    console.error('Error checking assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking assessment status',
      error: error.message
    });
  }
};
