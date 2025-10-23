import api from './api';

const LearningAPI = {
  async getAllTracks() {
    const response = await api.get('/learning/tracks');
    return response.data;
  },

  async getTrackById(trackId) {
    const response = await api.get(`/learning/tracks/${trackId}`);
    return response.data;
  },

  async getModulesByTrack(trackId) {
    const response = await api.get(`/learning/tracks/${trackId}/modules`);
    return response.data;
  },

  async getModuleById(moduleId) {
    const response = await api.get(`/learning/modules/${moduleId}`);
    return response.data;
  },

  async getLessonsByModule(moduleId) {
    const response = await api.get(`/learning/modules/${moduleId}/lessons`);
    return response.data;
  },

  async getLessonById(lessonId) {
    const response = await api.get(`/learning/lessons/${lessonId}`);
    return response.data;
  },

  async getContentById(contentId) {
    const response = await api.get(`/learning/content/${contentId}`);
    return response.data;
  },

  async getNextContent() {
    const response = await api.get('/learning/next');
    return response.data;
  }
};

export default LearningAPI;
