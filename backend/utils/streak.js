exports.updateStreak = (progressDoc) => {
  const today = new Date().setHours(0,0,0,0);
  const last = progressDoc.streak?.lastActivity ? new Date(progressDoc.streak.lastActivity).setHours(0,0,0,0) : null;

  if (!last) {
    progressDoc.streak = { currentStreak: 1, longestStreak: 1, lastActivity: new Date() };
  } else if (today - last === 86400000) {
    progressDoc.streak.currentStreak += 1;
  } else if (today - last > 86400000) {
    progressDoc.streak.currentStreak = 1;
  }

  progressDoc.streak.longestStreak = Math.max(
    progressDoc.streak.longestStreak || 0,
    progressDoc.streak.currentStreak
  );
  progressDoc.streak.lastActivity = new Date();
};
