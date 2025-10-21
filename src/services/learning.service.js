import api from './api';

class LearningService {
  // ========== TRACKS ==========
  async getAllTracks() {
    const response = await api.get('/learning/tracks');
    return response.data;
  }

  async getTrackById(trackId) {
    const response = await api.get(`/learning/tracks/${trackId}`);
    return response.data;
  }

  // ========== MODULES ==========
  async getModulesByTrack(trackId) {
    const response = await api.get(`/learning/tracks/${trackId}/modules`);
    return response.data;
  }

  async getModuleById(moduleId) {
    const response = await api.get(`/learning/modules/${moduleId}`);
    return response.data;
  }

  // ========== LESSONS ==========
  async getLessonsByModule(moduleId) {
    const response = await api.get(`/learning/modules/${moduleId}/lessons`);
    return response.data;
  }

  async getLessonById(lessonId) {
    const response = await api.get(`/learning/lessons/${lessonId}`);
    return response.data;
  }

  // ========== CONTENT ==========
  async getContentById(contentId) {
    const response = await api.get(`/learning/content/${contentId}`);
    return response.data;
  }

  // ========== LEARNING PATH ==========
  async getNextContent() {
    const response = await api.get('/learning/next');
    return response.data;
  }

  // ========== QUIZZES ==========
  async getQuizById(quizId) {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  }

  async submitQuiz(quizId, answers, timeSpent) {
    const response = await api.post(`/quizzes/${quizId}/submit`, {
      answers,
      timeSpent
    });
    return response.data;
  }

  // ========== LABS ==========
  async getLabById(labId) {
    const response = await api.get(`/quizzes/labs/${labId}`);
    return response.data;
  }

  async submitLab(labId, responses) {
    const response = await api.post(`/quizzes/labs/${labId}/submit`, {
      responses
    });
    return response.data;
  }

  // ========== PROGRESS ==========
  async getUserProgress() {
    const response = await api.get('/progress/me');
    return response.data;
  }

  async startTrack(trackId) {
    const response = await api.post(`/progress/tracks/${trackId}/start`);
    return response.data;
  }

  async startLesson(lessonId) {
    const response = await api.post(`/progress/lessons/${lessonId}/start`);
    return response.data;
  }

  async updateLessonProgress(lessonId, data) {
    const response = await api.put(`/progress/lessons/${lessonId}/update`, data);
    return response.data;
  }

  async completeLesson(lessonId, timeSpent) {
    const response = await api.post(`/progress/lessons/${lessonId}/complete`, {
      timeSpent
    });
    return response.data;
  }

  async getDashboardStats() {
    const response = await api.get('/progress/dashboard/stats');
    return response.data;
  }

  async getAnalytics() {
    const response = await api.get('/progress/analytics');
    return response.data;
  }

  // ========== GAMIFICATION ==========
  async getUserBadges() {
    const response = await api.get('/progress/badges');
    return response.data;
  }

  async getLeaderboard(timeframe = 'all', limit = 100) {
    const response = await api.get('/progress/leaderboard', {
      params: { timeframe, limit }
    });
    return response.data;
  }

  // ========== CERTIFICATES ==========
  async getUserCertificates() {
    const response = await api.get('/progress/certificates');
    return response.data;
  }

  async verifyCertificate(verificationCode) {
    const response = await api.get(`/progress/certificates/verify/${verificationCode}`);
    return response.data;
  }
}

export default new LearningService();
