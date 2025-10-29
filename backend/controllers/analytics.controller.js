const { getDashboardStats } = require('../services/analytics.service');

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.user.id);
    res.json(stats);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
