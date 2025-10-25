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
  // We’ll dedupe lessons by lessonId later for time; here we still count completions
  // but you can also dedupe completion by lessonId if you prefer.
  let lessonsCompleted = 0;

  progress.tracksProgress.forEach(tp => {
    if (tp.status === 'completed') tracksCompleted++;
    tp.modulesProgress.forEach(mp => {
      if (mp.status === 'completed') modulesCompleted++;
      (mp.lessonsProgress || []).forEach(lp => {
        if (lp.status === 'completed') lessonsCompleted++;
      });
    });
  });

  // ✅ De-dup total time by lessonId and take the MAX time per lesson
  const perLessonMaxTime = new Map();
  progress.tracksProgress.forEach(tp => {
    tp.modulesProgress.forEach(mp => {
      (mp.lessonsProgress || []).forEach(lp => {
        const key = String(lp.lessonId); // normalize ObjectId/string
        const t = Math.max(0, Number(lp.timeSpent || 0));
        const prev = perLessonMaxTime.get(key) || 0;
        if (t > prev) perLessonMaxTime.set(key, t);
      });
    });
  });

  const totalTimeSpent = Array.from(perLessonMaxTime.values())
    .reduce((sum, t) => sum + t, 0);

  const badgesCount = await UserBadge.countDocuments({ userId });

  return {
    totalXP: progress.totalXP,
    level: progress.level,
    currentStreak: progress.streak?.currentStreak || 0,
    longestStreak: progress.streak?.longestStreak || 0,
    totalTimeSpent,             // ← deduped & correct
    tracksCompleted,
    modulesCompleted,
    lessonsCompleted,
    badgesEarned: badgesCount,
    lastActivityAt: progress.lastActivityAt
  };
}

module.exports = { getDashboardStats };
