const mongoose = require('mongoose');
const Quiz = require('../models/quiz.model');
const Lab = require('../models/lab.model');
const Progress = require('../models/progress.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');

// ---------- helpers ----------
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));

/**
 * Find a Module document from a variety of possible identifiers:
 * - ObjectId (_id)
 * - moduleId (e.g., "module_1.1", "MOD-1.1")
 * - slug (if present in your schema)
 */
async function findModuleFlexible(ref) {
  if (!ref) return null;

  const raw = String(ref);

  // Try ObjectId direct
  if (isObjectId(raw)) {
    const byId = await Module.findById(raw);
    if (byId) return byId;
  }

  // Try exact moduleId
  let m = await Module.findOne({ moduleId: raw });
  if (m) return m;

  // Try normalized ("MOD-1.1" -> "module_1.1")
  const normalized = raw
    .toLowerCase()
    .replace(/^mod[-_]?/i, 'module_')
    .replace(/-/g, '_');
  if (normalized !== raw) {
    m = await Module.findOne({ moduleId: normalized });
    if (m) return m;
  }

  // Try slug (if you have it)
  m = await Module.findOne({ slug: raw });
  if (m) return m;

  // As a last attempt, if raw *looks* like ObjectId but failed findById (e.g. stored as string in moduleId)
  if (isObjectId(raw)) {
    m = await Module.findOne({ moduleId: raw });
    if (m) return m;
  }

  return null;
}

/** String compare helper for ObjectId/string mixes */
const eqId = (a, b) => String(a) === String(b);

// ========== QUIZ CONTROLLERS ==========

// Get quiz by ID (without correct answers for students)
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findOne({ quizId, status: 'active' });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Prepare quiz payload without correct answers
    const quizData = quiz.toObject();
    quizData.questions = quizData.questions.map((q) => {
      const question = { ...q };
      if (question.questionType !== 'short_answer') {
        question.options = question.options.map((opt) => ({
          optionId: opt.optionId,
          text: opt.text,
        }));
      }
      delete question.correctAnswer;
      question.explanation = undefined;
      return question;
    });

    // Previous attempts only matter for module quizzes
    let previousAttempts = [];
    let attemptsRemaining = -1;

    if (req.user && quiz.moduleId) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        const module = await findModuleFlexible(quiz.moduleId);
        if (module) {
          // match trackProgress by trackId safely
          const trackProgress =
            progress.tracksProgress?.find((tp) => eqId(tp.trackId, module.trackId)) || null;

          if (trackProgress) {
            const moduleProgress =
              trackProgress.modulesProgress?.find((mp) => eqId(mp.moduleId, module._id)) || null;

            if (moduleProgress) {
              previousAttempts =
                moduleProgress.quizAttempts?.map((qa) => ({
                  attemptNumber: qa.attemptNumber,
                  score: qa.score,
                  passed: qa.passed,
                  completedAt: qa.completedAt,
                })) || [];
              attemptsRemaining =
                quiz.attempts === -1 ? -1 : Math.max(0, quiz.attempts - previousAttempts.length);
            }
          }
        }
      }
    } else {
      attemptsRemaining = -1; // lesson mini-quiz, unlimited
    }

    res.json({
      quiz: quizData,
      previousAttempts,
      attemptsRemaining,
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

    // Ensure Progress exists
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }

    // Module quiz vs lesson mini-quiz
    const isModuleQuiz = !!quiz.moduleId;
    let moduleProgress = null;

    if (isModuleQuiz) {
      const module = await findModuleFlexible(quiz.moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      // Find matching trackProgress (trackId is usually an ObjectId)
      const trackProgress =
        progress.tracksProgress?.find((tp) => eqId(tp.trackId, module.trackId)) || null;
      if (!trackProgress) {
        return res.status(400).json({ message: 'You must start the track first' });
      }

      // Find moduleProgress by module._id (not module.moduleId)
      moduleProgress =
        trackProgress.modulesProgress?.find((mp) => eqId(mp.moduleId, module._id)) || null;
      if (!moduleProgress) {
        return res.status(400).json({ message: 'You must start the module first' });
      }

      // Check attempts
      if (quiz.attempts !== -1) {
        const used = moduleProgress.quizAttempts?.length || 0;
        if (used >= quiz.attempts) {
          return res.status(400).json({ message: 'No more attempts remaining' });
        }
      }
    }

    // Grade quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = answers.find((a) => a.questionId === question.questionId);
      let isCorrect = false;

      if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        isCorrect = !!(userAnswer && userAnswer.selectedAnswer === correctOption?.optionId);
      } else if (question.questionType === 'multiple_select') {
        const correctOptions = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.optionId)
          .sort();
        const userOptions = (userAnswer ? userAnswer.selectedAnswer : []).slice().sort();
        isCorrect = JSON.stringify(correctOptions) === JSON.stringify(userOptions);
      } else if (question.questionType === 'short_answer') {
        isCorrect =
          !!userAnswer &&
          String(userAnswer.selectedAnswer || '').trim().toLowerCase() ===
            String(question.correctAnswer || '').trim().toLowerCase();
      }

      if (isCorrect) earnedPoints += question.points;

      gradedAnswers.push({
        questionId: question.questionId,
        selectedAnswer: userAnswer ? userAnswer.selectedAnswer : null,
        isCorrect,
        markedForReview: userAnswer ? !!userAnswer.markedForReview : false,
        explanation: question.explanation,
        correctAnswer:
          question.questionType === 'short_answer'
            ? question.correctAnswer
            : question.options.filter((opt) => opt.isCorrect).map((opt) => opt.optionId),
      });
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Record attempt only for module quizzes
    let attemptNumber = 1;
    if (isModuleQuiz && moduleProgress) {
      const used = moduleProgress.quizAttempts?.length || 0;
      attemptNumber = used + 1;

      moduleProgress.quizAttempts.push({
        attemptNumber,
        score,
        passed,
        answers: gradedAnswers,
        timeSpent,
        completedAt: new Date(),
      });

      // Best score
      if (typeof moduleProgress.bestQuizScore !== 'number') moduleProgress.bestQuizScore = 0;
      if (score > moduleProgress.bestQuizScore) {
        moduleProgress.bestQuizScore = score;
      }

      // Mark module completed if all lessons completed and quiz passed
      if (passed) {
        const allLessonsCompleted = (moduleProgress.lessonsProgress || []).every(
          (lp) => lp.status === 'completed'
        );
        if (allLessonsCompleted && moduleProgress.status !== 'completed') {
          moduleProgress.status = 'completed';
          moduleProgress.completedAt = new Date();
        }
      }
    }

    // Award XP if passed (both module quiz and content quiz)
    let xpEarned = 0;
    let leveledUp = false;
    if (passed) {
      xpEarned = Math.round(score); // same rule you already used
      if (typeof progress.addXP === 'function') {
        leveledUp = !!progress.addXP(xpEarned);
      }
    }

    // Update streak & save
    if (typeof progress.updateStreak === 'function') progress.updateStreak();
    progress.lastActivityAt = new Date();

    // markModified not usually needed unless nested arrays are mixed types, but safe:
    progress.markModified('tracksProgress');
    await progress.save();

    res.json({
      success: true,
      score,
      passed,
      answers: gradedAnswers,
      attemptNumber,
      attemptsRemaining: isModuleQuiz
        ? quiz.attempts === -1
          ? -1
          : Math.max(0, quiz.attempts - attemptNumber)
        : -1,
      xpEarned,
      leveledUp,
      totalXP: progress.totalXP,
      level: progress.level,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== LAB CONTROLLERS ==========

exports.getLabById = async (req, res) => {
  try {
    const { labId } = req.params;
    const lab = await Lab.findOne({ labId, status: 'active' });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    const labData = lab.toObject();
    labData.challenges = labData.challenges.map((c) => ({
      challengeId: c.challengeId,
      title: c.title,
      description: c.description,
      mediaUrl: c.mediaUrl,
      mediaType: c.mediaType,
      difficulty: c.difficulty,
      points: c.points,
      order: c.order,
    }));

    let previousAttempts = [];
    if (req.user && lab.moduleId) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        // lab.moduleId is usually an ObjectId
        const module = await Module.findOne({ _id: lab.moduleId });
        if (module) {
          const trackProgress =
            progress.tracksProgress?.find((tp) => eqId(tp.trackId, module.trackId)) || null;
          if (trackProgress) {
            const moduleProgress =
              trackProgress.modulesProgress?.find((mp) => eqId(mp.moduleId, module._id)) || null;
            if (moduleProgress) {
              previousAttempts =
                moduleProgress.labAttempts
                  ?.filter((la) => la.labId === labId)
                  .map((la) => ({
                    attemptNumber: la.attemptNumber,
                    score: la.score,
                    passed: la.passed,
                    completedAt: la.completedAt,
                  })) || [];
            }
          }
        }
      }
    }

    res.json({
      lab: labData,
      previousAttempts,
      attemptsRemaining: lab.attempts === -1 ? -1 : lab.attempts - previousAttempts.length,
    });
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const { responses } = req.body;
    const userId = req.user._id;

    const lab = await Lab.findOne({ labId, status: 'active' });
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    let progress = await Progress.findOne({ userId });
    if (!progress) progress = new Progress({ userId });

    const module = await Module.findOne({ _id: lab.moduleId });
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const trackProgress =
      progress.tracksProgress?.find((tp) => eqId(tp.trackId, module.trackId)) || null;
    if (!trackProgress) {
      return res.status(400).json({ message: 'You must start the track first' });
    }

    const moduleProgress =
      trackProgress.modulesProgress?.find((mp) => eqId(mp.moduleId, module._id)) || null;
    if (!moduleProgress) {
      return res.status(400).json({ message: 'You must start the module first' });
    }

    const previousAttempts = (moduleProgress.labAttempts || []).filter((la) => la.labId === labId);
    if (lab.attempts !== -1 && previousAttempts.length >= lab.attempts) {
      return res.status(400).json({ message: 'No more attempts remaining' });
    }

    // Grade lab
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedResponses = [];

    lab.challenges.forEach((challenge) => {
      totalPoints += challenge.points;

      const userResponse = responses.find((r) => r.challengeId === challenge.challengeId);
      const isCorrect =
        !!userResponse &&
        ((challenge.isDeepfake && userResponse.verdict === 'fake') ||
          (!challenge.isDeepfake && userResponse.verdict === 'real'));

      if (isCorrect) earnedPoints += challenge.points;

      gradedResponses.push({
        challengeId: challenge.challengeId,
        verdict: userResponse ? userResponse.verdict : null,
        reasoning: userResponse ? userResponse.reasoning : null,
        isCorrect,
        timeSpent: userResponse ? userResponse.timeSpent : 0,
        correctAnswer: challenge.isDeepfake ? 'fake' : 'real',
        artifacts: challenge.artifacts,
      });
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= lab.passingScore;

    const attemptNumber = previousAttempts.length + 1;
    moduleProgress.labAttempts.push({
      labId,
      attemptNumber,
      score,
      passed,
      responses: gradedResponses,
      completedAt: new Date(),
    });

    if (typeof moduleProgress.bestLabScore !== 'number') moduleProgress.bestLabScore = 0;
    if (score > moduleProgress.bestLabScore) {
      moduleProgress.bestLabScore = score;
    }

    let xpEarned = 0;
    let leveledUp = false;
    if (passed) {
      xpEarned = Math.round(score * 1.5);
      if (typeof progress.addXP === 'function') {
        leveledUp = !!progress.addXP(xpEarned);
      }
      if (module.requiresLabCompletion && moduleProgress.status !== 'completed') {
        moduleProgress.status = 'completed';
        moduleProgress.completedAt = new Date();
      }
    }

    if (typeof progress.updateStreak === 'function') progress.updateStreak();
    progress.lastActivityAt = new Date();
    progress.markModified('tracksProgress');
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
      level: progress.level,
    });
  } catch (error) {
    console.error('Error submitting lab:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
