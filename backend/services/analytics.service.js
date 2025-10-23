const Progress = require('../models/progress.model');
const { UserBadge } = require('../models/badge.model');

async function getDashboardStats(userId) {
  const progress = await Progress.findOne({ userId });
  if (!progress) {
    return {
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalTimeSpent: 0,
      tracksCompleted: 0,
      modulesCompleted: 0,
      lessonsCompleted: 0,
      badgesEarned: 0
    };
  }

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

  return {
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
  };
}

module.exports = { getDashboardStats };
