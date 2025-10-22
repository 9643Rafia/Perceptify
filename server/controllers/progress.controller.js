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

    console.log('🚦 [startTrack] called - userId:', userId, 'trackId:', trackId);

    const track = await Track.findOne({ _id: trackId, status: 'active' });
    console.log('🚦 [startTrack] track found:', !!track, track ? track._id.toString() : null);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    let progress = await Progress.findOne({ userId });
    console.log('🚦 [startTrack] existing progress found:', !!progress);
    if (!progress) {
      progress = new Progress({ userId });
      console.log('🚦 [startTrack] created new progress for user');
    }

    // Check if track already started - use string compare to avoid ObjectId/string mismatch
    let trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(track._id));
    console.log('🚦 [startTrack] existing trackProgress found:', !!trackProgress);

    if (!trackProgress) {
      // Check prerequisites
      if (track.prerequisites && track.prerequisites.length > 0) {
        const prerequisitesCompleted = track.prerequisites.every(prereqId => {
          const prereqProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(prereqId));
          return prereqProgress && prereqProgress.status === 'completed';
        });

        console.log('🚦 [startTrack] prerequisitesCompleted:', prerequisitesCompleted);
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
      console.log('🟢 [startTrack] new trackProgress pushed');
    }

    // Unlock all modules for this track
    const allModules = await Module.find({ trackId: track._id, status: 'active' }).sort({ order: 1 });
    console.log('🔎 [startTrack] modules found for track:', allModules.length);
    allModules.forEach(m => console.log('   -', String(m._id), m.name, '| trackId:', String(m.trackId)));

    if (allModules && allModules.length > 0) {
      for (const mod of allModules) {
        const exists = trackProgress.modulesProgress.some(mp => String(mp.moduleId) === String(mod._id));
        console.log('🚦 [startTrack] module', String(mod._id), 'exists in progress:', exists);
        if (!exists) {
          const moduleProgress = {
            moduleId: mod._id,
            status: 'unlocked',
            lessonsProgress: [],
            quizAttempts: [],
            labAttempts: [],
            startedAt: new Date()
          };
          trackProgress.modulesProgress.push(moduleProgress);
          console.log('🟢 [startTrack] pushed moduleProgress for module:', String(mod._id));
        }
      }
      // Set the first module as current
      progress.currentModule = allModules[0]._id;
      console.log('🟢 [startTrack] progress.currentModule set to:', String(progress.currentModule));
      console.log('🟢 [startTrack] modulesProgress now has', trackProgress.modulesProgress.length, 'items');
    }

    trackProgress.status = 'in_progress';
    progress.lastActivityAt = new Date();

    console.log('🚦 [startTrack] saving progress...');
    await progress.save();
    console.log('🟢 [startTrack] progress saved. tracksProgress count:', progress.tracksProgress.length);
    // Print trackProgress snapshot
    const savedTrackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(track._id));
    console.log('🟢 [startTrack] savedTrackProgress modules count:', savedTrackProgress ? savedTrackProgress.modulesProgress.length : 'N/A');

    const modulesAdded = !!(savedTrackProgress && savedTrackProgress.modulesProgress && savedTrackProgress.modulesProgress.length > 0);
    const modulesCount = modulesAdded ? savedTrackProgress.modulesProgress.length : 0;
    // Set a response header so frontend clients can detect module population
    res.setHeader('X-Modules-Added', modulesAdded ? 'true' : 'false');

    res.json({
      success: true,
      message: 'Track started successfully',
      progress: savedTrackProgress || trackProgress,
      modulesAdded,
      modulesCount
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
    console.log('🎓 START LESSON - lessonId:', lessonId, 'userId:', userId);

    const lesson = await Lesson.findOne({ _id: lessonId, status: 'active' });
    console.log('🎓 START LESSON - Found lesson:', lesson ? lesson.name : 'NOT FOUND');
    if (!lesson) {
      console.log('❌ START LESSON - Lesson not found');
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const module = await Module.findById(lesson.moduleId);
    console.log('🎓 START LESSON - Found module:', module ? module.name : 'NOT FOUND');
    if (!module) {
      console.log('❌ START LESSON - Module not found');
      return res.status(404).json({ message: 'Module not found' });
    }

    let progress = await Progress.findOne({ userId });
    console.log('🎓 START LESSON - Found progress:', progress ? 'YES' : 'NO');
    if (!progress) {
      console.log('❌ START LESSON - No progress found, need to start track first');
      return res.status(400).json({ message: 'Please start the track first' });
    }

    // Find track and module progress (use string comparison)
    console.log('🎓 START LESSON - progress.tracksProgress length:', progress.tracksProgress ? progress.tracksProgress.length : 0);
    let trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
    console.log('🎓 START LESSON - Found track progress:', trackProgress ? 'YES' : 'NO');
    if (trackProgress) {
      try {
        console.log('🎓 START LESSON - trackProgress.modulesProgress snapshot:', trackProgress.modulesProgress.map(mp => ({ moduleId: String(mp.moduleId), status: mp.status, lessonsCount: mp.lessonsProgress ? mp.lessonsProgress.length : 0 })));
      } catch (e) {
        console.log('🎓 START LESSON - error printing trackProgress snapshot', e.message);
      }
    }
    if (!trackProgress) {
      console.log('❌ START LESSON - No track progress, need to start track first');
      return res.status(400).json({ message: 'Please start the track first' });
    }

    let moduleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(module._id));
    console.log('🎓 START LESSON - Found module progress:', moduleProgress ? 'YES' : 'NO');
    if (moduleProgress) {
      try {
        console.log('🎓 START LESSON - moduleProgress snapshot:', { moduleId: String(moduleProgress.moduleId), status: moduleProgress.status, lessonsProgress: moduleProgress.lessonsProgress.map(lp => ({ lessonId: String(lp.lessonId), status: lp.status })) });
      } catch (e) {
        console.log('🎓 START LESSON - error printing moduleProgress snapshot', e.message);
      }
    }
    if (!moduleProgress) {
      console.log('❌ START LESSON - Module not unlocked on first check, attempting retries...');
      let found = false;
      const maxRetries = 5;
      const delay = ms => new Promise(res => setTimeout(res, ms));
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await delay(150 * attempt); // backoff: 150ms, 300ms, 450ms...
          const refreshedProgress = await Progress.findOne({ userId });
          const refreshedTP = refreshedProgress && refreshedProgress.tracksProgress && refreshedProgress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
          const refreshedMP = refreshedTP && refreshedTP.modulesProgress && refreshedTP.modulesProgress.find(mp => String(mp.moduleId) === String(module._id));
          console.log(`🎓 START LESSON - retry ${attempt}/${maxRetries}: found moduleProgress:`, !!refreshedMP);
          if (refreshedMP) {
            moduleProgress = refreshedMP;
            trackProgress = refreshedTP;
            found = true;
            break;
          }
        } catch (e) {
          console.log('🎓 START LESSON - retry error:', e.message);
        }
      }
      if (!found) {
        console.log('🎓 START LESSON - Module still not unlocked after retries, creating moduleProgress on-demand');
        // Create moduleProgress on-demand to be resilient to races / missing population
        try {
          const newModuleProgress = {
            moduleId: module._id,
            status: 'unlocked',
            lessonsProgress: [],
            quizAttempts: [],
            labAttempts: [],
            startedAt: new Date()
          };
          trackProgress.modulesProgress.push(newModuleProgress);
          moduleProgress = newModuleProgress;
          console.log('🎓 START LESSON - on-demand moduleProgress created for module:', String(module._id));
        } catch (e) {
          console.log('🎓 START LESSON - error creating on-demand moduleProgress:', e.message);
          return res.status(400).json({ message: 'Module not unlocked' });
        }
      }
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
      console.log('🎓 START LESSON - Pushed lessonProgress:', { lessonId: String(lessonProgress.lessonId), status: lessonProgress.status });
    } else {
      lessonProgress.status = 'in_progress';
    }

    // Update current lesson
    progress.currentLesson = lesson._id;
    moduleProgress.status = 'in_progress';
    trackProgress.status = 'in_progress';
    progress.lastActivityAt = new Date();

      // Debug snapshot before save
      try {
        console.log('🎓 START LESSON - pre-save moduleProgress snapshot:', { moduleId: String(moduleProgress.moduleId), status: moduleProgress.status, lessonsProgressCount: moduleProgress.lessonsProgress.length });
        console.log('🎓 START LESSON - pre-save trackProgress modules count:', trackProgress.modulesProgress.length);
      } catch (e) {
        console.log('🎓 START LESSON - error preparing pre-save snapshot:', e.message);
      }

    await progress.save();

      // Debug after save
      try {
        const refreshed = await Progress.findOne({ userId });
        const savedTP = refreshed.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
        console.log('🎓 START LESSON - post-save savedTP modules snapshot:', savedTP ? savedTP.modulesProgress.map(mp => ({ moduleId: String(mp.moduleId), status: mp.status })) : 'N/A');
      } catch (e) {
        console.log('🎓 START LESSON - error fetching post-save snapshot:', e.message);
      }

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
  let moduleProgress = trackProgress?.modulesProgress.find(mp => mp.moduleId === module._id);
  let lessonProgress = moduleProgress?.lessonsProgress.find(lp => lp.lessonId === lessonId);

    if (!lessonProgress) {
      // Be resilient: create lessonProgress on-demand (similar to startLesson flow)
      console.log('⚠️ COMPLETE LESSON - lessonProgress missing, creating on-demand');

      if (!moduleProgress) {
        // Create moduleProgress on-demand
        const newModuleProgress = {
          moduleId: module._id,
          status: 'unlocked',
          lessonsProgress: [],
          quizAttempts: [],
          labAttempts: [],
          startedAt: new Date()
        };
        trackProgress.modulesProgress.push(newModuleProgress);
        moduleProgress = newModuleProgress;
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
      console.log('⚠️ COMPLETE LESSON - created lessonProgress on-demand for lesson', String(lesson._id));
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
  const { timeSpent, skipQuiz, forceModuleComplete } = req.body;
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

    // Find the lesson progress (be resilient: create missing pieces on-demand)
    let trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
    if (!trackProgress) {
      // Create a new trackProgress entry on-demand (minimal fields)
      trackProgress = {
        trackId: module.trackId,
        status: 'unlocked',
        modulesProgress: [],
        startedAt: new Date()
      };
      progress.tracksProgress.push(trackProgress);
    }

    let moduleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(module._id));
    if (!moduleProgress) {
      // Create moduleProgress on-demand
      moduleProgress = {
        moduleId: module._id,
        status: 'unlocked',
        lessonsProgress: [],
        quizAttempts: [],
        labAttempts: [],
        startedAt: new Date()
      };
      trackProgress.modulesProgress.push(moduleProgress);
    }

    let lessonProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(lesson._id));
    if (!lessonProgress) {
      // Create lessonProgress on-demand
      lessonProgress = {
        lessonId: lesson._id,
        status: 'in_progress',
        timeSpent: 0,
        lastPosition: 0,
        completedContentItems: [],
        startedAt: new Date()
      };
      moduleProgress.lessonsProgress.push(lessonProgress);
      console.log('⚠️ COMPLETE LESSON - created lessonProgress on-demand for lesson', String(lesson._id));
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

    // If requested to skip module-level quiz or if all lessons completed and no module quiz, unlock next module
    if ((skipQuiz || forceModuleComplete) || (allLessonsCompleted && !module.quizId && !module.requiresLabCompletion)) {
      // If skipping quiz but module has a quizId, record a synthetic passed attempt so analytics reflect completion
      if (skipQuiz && module.quizId) {
        try {
          const attemptNumber = (moduleProgress.quizAttempts?.length || 0) + 1;
          moduleProgress.quizAttempts.push({
            attemptNumber,
            score: 100,
            passed: true,
            answers: [],
            timeSpent: 0,
            completedAt: new Date()
          });
          moduleProgress.bestQuizScore = Math.max(moduleProgress.bestQuizScore || 0, 100);
        } catch (e) {
          console.warn('Warning: failed to record synthetic quiz attempt for module', module._id, e.message || e);
        }
      }
      // mark module completed
      moduleProgress.status = 'completed';
      moduleProgress.completedAt = new Date();

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
