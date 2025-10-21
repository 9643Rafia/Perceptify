const Progress = require('../models/progress.model');
const { Badge, UserBadge } = require('../models/badge.model');
const Certificate = require('../models/certificate.model');
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');

// ========== PROGRESS CONTROLLERS ==========

// Get user progress overview
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    let progress = await Progress.findOne({ userId });

    if (!progress) {
      // Create initial progress
      progress = new Progress({ userId });
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start a track
exports.startTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const userId = req.user.id;

    const track = await Track.findOne({ _id: trackId, status: 'active' });
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }

    // Check if track already started
    let trackProgress = progress.tracksProgress.find(tp => tp.trackId === track._id);

    if (!trackProgress) {
      // Check prerequisites
      if (track.prerequisites && track.prerequisites.length > 0) {
        const prerequisitesCompleted = track.prerequisites.every(prereqId => {
          const prereqProgress = progress.tracksProgress.find(tp => tp.trackId === prereqId);
          return prereqProgress && prereqProgress.status === 'completed';
        });

        if (!prerequisitesCompleted) {
          return res.status(400).json({ message: 'Prerequisites not completed' });
        }
      }

      // Create new track progress
      trackProgress = {
        trackId: track._id,
        status: 'unlocked',
        modulesProgress: [],
        startedAt: new Date()
      };

      progress.tracksProgress.push(trackProgress);
      progress.currentTrack = track._id;
    }

    // Get first module and unlock it
    const firstModule = await Module.findOne({ trackId: track._id, status: 'active' }).sort({ order: 1 });

    if (firstModule) {
      let moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === firstModule._id);

      if (!moduleProgress) {
        moduleProgress = {
          moduleId: firstModule._id,
          status: 'unlocked',
          lessonsProgress: [],
          quizAttempts: [],
          labAttempts: [],
          startedAt: new Date()
        };

        trackProgress.modulesProgress.push(moduleProgress);
        progress.currentModule = firstModule._id;
      }
    }

    trackProgress.status = 'in_progress';
    progress.lastActivityAt = new Date();

    await progress.save();

    res.json({
      success: true,
      message: 'Track started successfully',
      progress: trackProgress
    });

  } catch (error) {
    console.error('Error starting track:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start a lesson
exports.startLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const lesson = await Lesson.findOne({ _id: lessonId, status: 'active' });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const module = await Module.findById(lesson.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      return res.status(400).json({ message: 'Please start the track first' });
    }

    // Find track and module progress
    let trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
    if (!trackProgress) {
      return res.status(400).json({ message: 'Please start the track first' });
    }

    let moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === module._id);
    if (!moduleProgress) {
      return res.status(400).json({ message: 'Module not unlocked' });
    }

    // Check if lesson is already started
    let lessonProgress = moduleProgress.lessonsProgress.find(lp => lp.lessonId === lesson._id);

    if (!lessonProgress) {
      // Check prerequisites
      if (lesson.prerequisites && lesson.prerequisites.length > 0) {
        const prerequisitesCompleted = lesson.prerequisites.every(prereqId => {
          const prereqProgress = moduleProgress.lessonsProgress.find(lp => lp.lessonId === prereqId);
          return prereqProgress && prereqProgress.status === 'completed';
        });

        if (!prerequisitesCompleted) {
          return res.status(400).json({ message: 'Prerequisites not completed' });
        }
      }

      lessonProgress = {
        lessonId: lesson._id,
        status: 'in_progress',
        timeSpent: 0,
        lastPosition: 0,
        completedContentItems: [],
        startedAt: new Date()
      };

      moduleProgress.lessonsProgress.push(lessonProgress);
    } else {
      lessonProgress.status = 'in_progress';
    }

    // Update current lesson
    progress.currentLesson = lesson._id;
    moduleProgress.status = 'in_progress';
    trackProgress.status = 'in_progress';
    progress.lastActivityAt = new Date();

    await progress.save();

    res.json({
      success: true,
      message: 'Lesson started successfully',
      progress: lessonProgress
    });

  } catch (error) {
    console.error('Error starting lesson:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update lesson progress (auto-save)
exports.updateLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent, lastPosition, completedContentItems } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const module = await Module.findById(lesson.moduleId);
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      return res.status(400).json({ message: 'Progress not found' });
    }

    // Find the lesson progress
    const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
    const moduleProgress = trackProgress?.modulesProgress.find(mp => mp.moduleId === module._id);
    const lessonProgress = moduleProgress?.lessonsProgress.find(lp => lp.lessonId === lessonId);

    if (!lessonProgress) {
      return res.status(400).json({ message: 'Lesson not started' });
    }

    // Update progress
    if (timeSpent !== undefined) {
      lessonProgress.timeSpent = timeSpent;
      progress.totalTimeSpent += timeSpent;
    }

    if (lastPosition !== undefined) {
      lessonProgress.lastPosition = lastPosition;
    }

    if (completedContentItems) {
      lessonProgress.completedContentItems = completedContentItems;
    }

    progress.lastActivityAt = new Date();
    progress.updateStreak();

    await progress.save();

    res.json({
      success: true,
      message: 'Progress saved',
      progress: lessonProgress
    });

  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Complete a lesson
exports.completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const module = await Module.findById(lesson.moduleId);
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      return res.status(400).json({ message: 'Progress not found' });
    }

    // Find the lesson progress
    const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
    const moduleProgress = trackProgress?.modulesProgress.find(mp => mp.moduleId === module._id);
    const lessonProgress = moduleProgress?.lessonsProgress.find(lp => lp.lessonId === lessonId);

    if (!lessonProgress) {
      return res.status(400).json({ message: 'Lesson not started' });
    }

    // Mark as completed
    lessonProgress.status = 'completed';
    lessonProgress.completedAt = new Date();
    if (timeSpent) {
      lessonProgress.timeSpent = timeSpent;
      progress.totalTimeSpent += timeSpent;
    }

    // Award XP for completing lesson
    const xpEarned = 50; // Base XP for lesson completion
    const leveledUp = progress.addXP(xpEarned);

    // Check if all lessons in module are completed
    const allLessonsCompleted = moduleProgress.lessonsProgress.every(lp => lp.status === 'completed');

    // Unlock next lesson in the module
    const nextLesson = await Lesson.findOne({
      moduleId: module._id,
      order: { $gt: lesson.order },
      status: 'active'
    }).sort({ order: 1 });

    if (nextLesson) {
      const nextLessonProgress = moduleProgress.lessonsProgress.find(lp => lp.lessonId === nextLesson._id);
      if (!nextLessonProgress) {
        moduleProgress.lessonsProgress.push({
          lessonId: nextLesson._id,
          status: 'not_started',
          timeSpent: 0,
          lastPosition: 0,
          completedContentItems: []
        });
      }
    }

    // If all lessons completed and no quiz, unlock next module
    if (allLessonsCompleted && !module.quizId && !module.requiresLabCompletion) {
      const nextModule = await Module.findOne({
        trackId: module.trackId,
        order: { $gt: module.order },
        status: 'active'
      }).sort({ order: 1 });

      if (nextModule) {
        const nextModuleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === nextModule._id);
        if (!nextModuleProgress) {
          trackProgress.modulesProgress.push({
            moduleId: nextModule._id,
            status: 'unlocked',
            lessonsProgress: [],
            quizAttempts: [],
            labAttempts: []
          });
        }
      }
    }

    progress.updateStreak();
    progress.lastActivityAt = new Date();

    await progress.save();

    res.json({
      success: true,
      message: 'Lesson completed successfully',
      xpEarned,
      leveledUp,
      totalXP: progress.totalXP,
      level: progress.level,
      progress: lessonProgress
    });

  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await Progress.findOne({ userId });

    if (!progress) {
      return res.json({
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpent: 0,
        tracksCompleted: 0,
        modulesCompleted: 0,
        lessonsCompleted: 0,
        badgesEarned: 0
      });
    }

    // Calculate stats
    let tracksCompleted = 0;
    let modulesCompleted = 0;
    let lessonsCompleted = 0;

    progress.tracksProgress.forEach(tp => {
      if (tp.status === 'completed') tracksCompleted++;

      tp.modulesProgress.forEach(mp => {
        if (mp.status === 'completed') modulesCompleted++;

        mp.lessonsProgress.forEach(lp => {
          if (lp.status === 'completed') lessonsCompleted++;
        });
      });
    });

    const badgesCount = await UserBadge.countDocuments({ userId });

    res.json({
      totalXP: progress.totalXP,
      level: progress.level,
      currentStreak: progress.streak.currentStreak,
      longestStreak: progress.streak.longestStreak,
      totalTimeSpent: progress.totalTimeSpent,
      tracksCompleted,
      modulesCompleted,
      lessonsCompleted,
      badgesEarned: badgesCount,
      lastActivityAt: progress.lastActivityAt
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== GAMIFICATION CONTROLLERS ==========

// Get user badges
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const userBadges = await UserBadge.find({ userId }).sort({ earnedAt: -1 });

    const badges = await Badge.find({ isActive: true });

    const earnedBadges = [];
    const availableBadges = [];

    badges.forEach(badge => {
      const earned = userBadges.find(ub => ub.badgeId === badge.badgeId);
      if (earned) {
        earnedBadges.push({
          ...badge.toObject(),
          earnedAt: earned.earnedAt,
          progress: earned.progress
        });
      } else {
        availableBadges.push(badge);
      }
    });

    res.json({
      earnedBadges,
      availableBadges,
      totalEarned: earnedBadges.length,
      totalAvailable: badges.length
    });

  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { timeframe = 'all', limit = 100 } = req.query;
    const userId = req.user.id;

    let dateFilter = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { lastActivityAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { lastActivityAt: { $gte: monthAgo } };
    }

    const leaderboard = await Progress.find(dateFilter)
      .sort({ totalXP: -1, level: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'fullName email')
      .select('userId totalXP level streak.currentStreak');

    const userRank = await Progress.countDocuments({
      ...dateFilter,
      totalXP: { $gt: (await Progress.findOne({ userId }))?.totalXP || 0 }
    }) + 1;

    res.json({
      leaderboard: leaderboard.map((p, index) => ({
        rank: index + 1,
        fullName: p.userId.fullName,
        totalXP: p.totalXP,
        level: p.level,
        currentStreak: p.streak.currentStreak
      })),
      userRank
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await Progress.findOne({ userId });

    if (!progress) {
      return res.json({
        timeByModule: [],
        quizPerformance: [],
        labPerformance: [],
        weeklyActivity: []
      });
    }

    // Time spent by module
    const timeByModule = [];
    progress.tracksProgress.forEach(tp => {
      tp.modulesProgress.forEach(async mp => {
        const module = await Module.findById(mp.moduleId);
        const totalTime = mp.lessonsProgress.reduce((sum, lp) => sum + lp.timeSpent, 0);
        timeByModule.push({
          moduleId: mp.moduleId,
          moduleName: module?.name || 'Unknown',
          timeSpent: totalTime
        });
      });
    });

    // Quiz performance
    const quizPerformance = [];
    progress.tracksProgress.forEach(tp => {
      tp.modulesProgress.forEach(async mp => {
        const module = await Module.findById(mp.moduleId);
        if (mp.quizAttempts.length > 0) {
          quizPerformance.push({
            moduleId: mp.moduleId,
            moduleName: module?.name || 'Unknown',
            attempts: mp.quizAttempts.length,
            bestScore: mp.bestQuizScore,
            averageScore: mp.quizAttempts.reduce((sum, qa) => sum + qa.score, 0) / mp.quizAttempts.length
          });
        }
      });
    });

    // Lab performance
    const labPerformance = [];
    progress.tracksProgress.forEach(tp => {
      tp.modulesProgress.forEach(async mp => {
        const module = await Module.findById(mp.moduleId);
        if (mp.labAttempts.length > 0) {
          labPerformance.push({
            moduleId: mp.moduleId,
            moduleName: module?.name || 'Unknown',
            attempts: mp.labAttempts.length,
            bestScore: mp.bestLabScore,
            averageScore: mp.labAttempts.reduce((sum, la) => sum + la.score, 0) / mp.labAttempts.length
          });
        }
      });
    });

    res.json({
      timeByModule,
      quizPerformance,
      labPerformance,
      totalTimeSpent: progress.totalTimeSpent,
      averageSessionTime: progress.totalTimeSpent / (progress.tracksProgress.length || 1)
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user certificates
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await Certificate.find({ userId, isValid: true })
      .sort({ issueDate: -1 })
      .populate('trackId');

    res.json(certificates);

  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify certificate
exports.verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findOne({ verificationCode, isValid: true })
      .populate('userId', 'fullName email')
      .populate('trackId');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found or invalid' });
    }

    res.json({
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        recipientName: certificate.userId.fullName,
        trackName: certificate.trackId.name,
        issueDate: certificate.issueDate,
        achievements: certificate.achievements
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
