import api from './api';

const DashboardAPI = {
  async getDashboardStats() {
    // Backend exposes GET /api/analytics/dashboard
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
};

export default DashboardAPI;
