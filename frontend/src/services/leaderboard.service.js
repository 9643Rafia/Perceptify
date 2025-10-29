import api from './api';

const LeaderboardAPI = {
  async getLeaderboard(timeframe = 'all', limit = 100) {
    const response = await api.get('/progress/leaderboard', { params: { timeframe, limit } });
    return response.data;
  }
};

export default LeaderboardAPI;
