import api from './api';

const ProgressAPI = {
  async getUserProgress() {
    const response = await api.get('/progress/me');
    return response.data;
  },

  async startTrack(trackId) {
    const response = await api.post(`/progress/${trackId}/start`);
    return response.data;
  }
};

export default ProgressAPI;
