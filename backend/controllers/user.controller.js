const User = require('../models/user.model');

// @desc    Save user's assessment results and learning level
// @route   POST /api/users/assessment
// @access  Private
exports.saveAssessmentLevel = async (req, res) => {
  try {
    const { email, name, learningLevel, assessmentScore } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!learningLevel || assessmentScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Learning level and assessment score are required'
      });
    }
    const totalLessons = await Lesson.countDocuments();
    const completed = await LessonProgress.countDocuments({ userId, status: 'completed' });
    const percent = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;

    const modules = await Module.find().populate('lessons');
    let currentModule = null;
    for (const m of modules) {
      const count = await LessonProgress.countDocuments({
        userId,
        lessonId: { $in: m.lessons },
        status: 'completed',
      });
      if (count < m.lessons.length) {
        currentModule = m;
        break;
      }
    }

    // Validate learning level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(learningLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning level. Must be Beginner, Intermediate, or Advanced'
      });
    }

    // Validate score range
    if (assessmentScore < 0 || assessmentScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Assessment score must be between 0 and 100'
      });
    }

    // Find and update user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's assessment fields
    user.learningLevel = learningLevel;
    user.assessmentScore = assessmentScore;
    user.assessmentCompleted = true;
    user.assessmentDate = Date.now();
    user.updatedAt = Date.now();

    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Learning level assigned successfully',
      data: {
        learningLevel: user.learningLevel,
        assessmentScore: user.assessmentScore,
        assessmentCompleted: user.assessmentCompleted,
        assessmentDate: user.assessmentDate
      }
    });
  } catch (error) {
    console.error('Error saving assessment level:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving assessment level',
      error: error.message
    });
  }
};

// @desc    Get user's learning level and assessment info
// @route   GET /api/users/assessment
// @access  Private
exports.getAssessmentLevel = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'fullName email learningLevel assessmentScore assessmentCompleted assessmentDate'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        fullName: user.fullName,
        email: user.email,
        learningLevel: user.learningLevel,
        assessmentScore: user.assessmentScore,
        assessmentCompleted: user.assessmentCompleted,
        assessmentDate: user.assessmentDate
      }
    });
  } catch (error) {
    console.error('Error fetching assessment level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessment level',
      error: error.message
    });
  }
};

// @desc    Get user's complete profile including learning data
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};
