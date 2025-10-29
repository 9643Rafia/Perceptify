const { Badge, UserBadge } = require('../models/badge.model');
const Progress = require('../models/progress.model');

/**
 * Fetch all user badges and classify them as earned or available.
 */
async function getUserBadges(userId) {
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

  return {
    earnedBadges,
    availableBadges,
    totalEarned: earnedBadges.length,
    totalAvailable: badges.length
  };
}

/**
 * Generate leaderboard for top users by XP & level.
 */
async function getLeaderboard(timeframe = 'all', limit = 100) {
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

  const formatted = leaderboard.map((p, index) => ({
    rank: index + 1,
    fullName: p.userId?.fullName || 'Unknown',
    totalXP: p.totalXP,
    level: p.level,
    currentStreak: p.streak?.currentStreak || 0
  }));

  return formatted;
}

module.exports = { getUserBadges, getLeaderboard };
