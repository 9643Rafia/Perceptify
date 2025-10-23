const { getUserBadges, getLeaderboard } = require('../services/gamification.service');

exports.getUserBadges = async (req, res) => {
  try {
    const data = await getUserBadges(req.user.id);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { timeframe = 'all', limit = 100 } = req.query;
    const leaderboard = await getLeaderboard(timeframe, limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
