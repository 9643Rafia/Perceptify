const Quiz = require('../models/quiz.model');
const Lab = require('../models/lab.model');
const Progress = require('../models/progress.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');

// ========== QUIZ CONTROLLERS ==========

// Get quiz by ID (without correct answers for students)
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({ quizId, status: 'active' });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Remove correct answers from response
    const quizData = quiz.toObject();
    quizData.questions = quizData.questions.map(q => {
      const question = { ...q };

      if (question.questionType !== 'short_answer') {
        question.options = question.options.map(opt => ({
          optionId: opt.optionId,
          text: opt.text
        }));
      }

      delete question.correctAnswer;
      // Keep explanation but don't send it until after submission
      question.explanation = undefined;

      return question;
    });

    // Get user's previous attempts
    let previousAttempts = [];
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress && quiz.moduleId) {
        const module = await Module.findOne({ moduleId: quiz.moduleId });
        if (module) {
          const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
          if (trackProgress) {
            const moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === module._id);
            if (moduleProgress) {
              previousAttempts = moduleProgress.quizAttempts.map(qa => ({
                attemptNumber: qa.attemptNumber,
                score: qa.score,
                passed: qa.passed,
                completedAt: qa.completedAt
              }));
            }
          }
        }
      }
    }

    res.json({
      quiz: quizData,
      previousAttempts,
      attemptsRemaining: quiz.attempts === -1 ? -1 : quiz.attempts - previousAttempts.length
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user._id;

    const quiz = await Quiz.findOne({ quizId, status: 'active' });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Get progress
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = new Progress({ userId });
    }

    // Find the right track and module progress
    const module = await Module.findOne({ moduleId: quiz.moduleId });
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
    if (!trackProgress) {
      return res.status(400).json({ message: 'You must start the track first' });
    }

    let moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === module._id);
    if (!moduleProgress) {
      return res.status(400).json({ message: 'You must start the module first' });
    }

    // Check attempts remaining
    if (quiz.attempts !== -1 && moduleProgress.quizAttempts.length >= quiz.attempts) {
      return res.status(400).json({ message: 'No more attempts remaining' });
    }

    // Grade the quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    quiz.questions.forEach(question => {
      totalPoints += question.points;

      const userAnswer = answers.find(a => a.questionId === question.questionId);
      let isCorrect = false;

      if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = userAnswer && userAnswer.selectedAnswer === correctOption.optionId;
      } else if (question.questionType === 'multiple_select') {
        const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.optionId);
        const userOptions = userAnswer ? userAnswer.selectedAnswer.sort() : [];
        isCorrect = JSON.stringify(correctOptions.sort()) === JSON.stringify(userOptions);
      } else if (question.questionType === 'short_answer') {
        // Simple case-insensitive comparison
        isCorrect = userAnswer && userAnswer.selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      gradedAnswers.push({
        questionId: question.questionId,
        selectedAnswer: userAnswer ? userAnswer.selectedAnswer : null,
        isCorrect,
        markedForReview: userAnswer ? userAnswer.markedForReview : false,
        explanation: question.explanation,
        correctAnswer: question.questionType === 'short_answer' ? question.correctAnswer : question.options.filter(opt => opt.isCorrect).map(opt => opt.optionId)
      });
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= quiz.passingScore;

    // Record the attempt
    const attemptNumber = moduleProgress.quizAttempts.length + 1;
    moduleProgress.quizAttempts.push({
      attemptNumber,
      score,
      passed,
      answers: gradedAnswers,
      timeSpent,
      completedAt: new Date()
    });

    // Update best score
    if (score > moduleProgress.bestQuizScore) {
      moduleProgress.bestQuizScore = score;
    }

    // Award XP if passed
    let xpEarned = 0;
    let leveledUp = false;
    if (passed) {
      // Award XP based on score (max 100 XP per quiz)
      xpEarned = Math.round(score);
      leveledUp = progress.addXP(xpEarned);

      // Mark module as completed if all lessons and quiz are done
      const allLessonsCompleted = moduleProgress.lessonsProgress.every(lp => lp.status === 'completed');
      if (allLessonsCompleted && moduleProgress.status !== 'completed') {
        moduleProgress.status = 'completed';
        moduleProgress.completedAt = new Date();
      }
    }

    // Update streak
    progress.updateStreak();
    progress.lastActivityAt = new Date();

    await progress.save();

    res.json({
      success: true,
      score,
      passed,
      answers: gradedAnswers,
      attemptNumber,
      attemptsRemaining: quiz.attempts === -1 ? -1 : quiz.attempts - attemptNumber,
      xpEarned,
      leveledUp,
      totalXP: progress.totalXP,
      level: progress.level
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== LAB CONTROLLERS ==========

// Get lab by ID
exports.getLabById = async (req, res) => {
  try {
    const { labId } = req.params;

    const lab = await Lab.findOne({ labId, status: 'active' });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Remove correct answers from challenges
    const labData = lab.toObject();
    labData.challenges = labData.challenges.map(c => ({
      challengeId: c.challengeId,
      title: c.title,
      description: c.description,
      mediaUrl: c.mediaUrl,
      mediaType: c.mediaType,
      difficulty: c.difficulty,
      points: c.points,
      order: c.order
    }));

    // Get user's previous attempts
    let previousAttempts = [];
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress && lab.moduleId) {
        const module = await Module.findOne({ _id: lab.moduleId });
        if (module) {
          const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
          if (trackProgress) {
            const moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === module._id);
            if (moduleProgress) {
              previousAttempts = moduleProgress.labAttempts
                .filter(la => la.labId === labId)
                .map(la => ({
                  attemptNumber: la.attemptNumber,
                  score: la.score,
                  passed: la.passed,
                  completedAt: la.completedAt
                }));
            }
          }
        }
      }
    }

    res.json({
      lab: labData,
      previousAttempts,
      attemptsRemaining: lab.attempts === -1 ? -1 : lab.attempts - previousAttempts.length
    });
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit lab
exports.submitLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const { responses } = req.body; // Array of { challengeId, verdict, reasoning, timeSpent }
    const userId = req.user._id;

    const lab = await Lab.findOne({ labId, status: 'active' });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Get progress
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = new Progress({ userId });
    }

    // Find the right track and module progress
    const module = await Module.findOne({ _id: lab.moduleId });
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
    if (!trackProgress) {
      return res.status(400).json({ message: 'You must start the track first' });
    }

    let moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === module._id);
    if (!moduleProgress) {
      return res.status(400).json({ message: 'You must start the module first' });
    }

    // Check attempts remaining
    const previousAttempts = moduleProgress.labAttempts.filter(la => la.labId === labId);
    if (lab.attempts !== -1 && previousAttempts.length >= lab.attempts) {
      return res.status(400).json({ message: 'No more attempts remaining' });
    }

    // Grade the lab
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedResponses = [];

    lab.challenges.forEach(challenge => {
      totalPoints += challenge.points;

      const userResponse = responses.find(r => r.challengeId === challenge.challengeId);
      const isCorrect = userResponse && (
        (challenge.isDeepfake && userResponse.verdict === 'fake') ||
        (!challenge.isDeepfake && userResponse.verdict === 'real')
      );

      if (isCorrect) {
        earnedPoints += challenge.points;
      }

      gradedResponses.push({
        challengeId: challenge.challengeId,
        verdict: userResponse ? userResponse.verdict : null,
        reasoning: userResponse ? userResponse.reasoning : null,
        isCorrect,
        timeSpent: userResponse ? userResponse.timeSpent : 0,
        correctAnswer: challenge.isDeepfake ? 'fake' : 'real',
        artifacts: challenge.artifacts
      });
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= lab.passingScore;

    // Record the attempt
    const attemptNumber = previousAttempts.length + 1;
    moduleProgress.labAttempts.push({
      labId,
      attemptNumber,
      score,
      passed,
      responses: gradedResponses,
      completedAt: new Date()
    });

    // Update best lab score
    if (score > moduleProgress.bestLabScore) {
      moduleProgress.bestLabScore = score;
    }

    // Award XP if passed
    let xpEarned = 0;
    let leveledUp = false;
    if (passed) {
      // Award XP based on score and difficulty
      xpEarned = Math.round(score * 1.5); // Labs give more XP
      leveledUp = progress.addXP(xpEarned);

      // Mark module as completed if required
      if (module.requiresLabCompletion && moduleProgress.status !== 'completed') {
        moduleProgress.status = 'completed';
        moduleProgress.completedAt = new Date();
      }
    }

    // Update streak
    progress.updateStreak();
    progress.lastActivityAt = new Date();

    await progress.save();

    res.json({
      success: true,
      score,
      passed,
      responses: gradedResponses,
      attemptNumber,
      attemptsRemaining: lab.attempts === -1 ? -1 : lab.attempts - attemptNumber,
      xpEarned,
      leveledUp,
      totalXP: progress.totalXP,
      level: progress.level
    });

  } catch (error) {
    console.error('Error submitting lab:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
