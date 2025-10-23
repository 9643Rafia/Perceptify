import api from './api';

const ProgressAPI = {
  async getUserProgress() {
    const response = await api.get('/progress/me');
    return response.data;
  },

  async startTrack(trackId) {
    const response = await api.post(`/progress/tracks/${trackId}/start`);
    return response;
  },

  async startLesson(lessonId) {
    const response = await api.post(`/progress/lessons/${lessonId}/start`);
    return response.data;
  },

  async updateLessonProgress(lessonId, data) {
    const response = await api.put(`/progress/lessons/${lessonId}/update`, data);
    return response.data;
  },

  async completeLesson(lessonId, timeSpent, options = {}) {
    const body = { timeSpent };
    if (options.skipQuiz) body.skipQuiz = true;
    if (options.forceModuleComplete) body.forceModuleComplete = true;
    const response = await api.post(`/progress/lessons/${lessonId}/complete`, body);
    return response.data;
  },

  async getDashboardStats() {
    const response = await api.get('/progress/dashboard/stats');
    return response.data;
  },

  async getAnalytics() {
    const response = await api.get('/progress/analytics');
    return response.data;
  },

  async getUserBadges() {
    const response = await api.get('/progress/badges');
    return response.data;
  },

  async getLeaderboard(timeframe = 'all', limit = 100) {
    const response = await api.get('/progress/leaderboard', { params: { timeframe, limit } });
    return response.data;
  },

  async getUserCertificates() {
    const response = await api.get('/progress/certificates');
    return response.data;
  },

  async verifyCertificate(verificationCode) {
    const response = await api.get(`/progress/certificates/verify/${verificationCode}`);
    return response.data;
  }
};

export default ProgressAPI;
