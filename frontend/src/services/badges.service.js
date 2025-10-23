import api from './api';

const BadgesAPI = {
  async getUserBadges() {
    const response = await api.get('/gamification/badges');
    return response.data;
  }
};

export default BadgesAPI;
