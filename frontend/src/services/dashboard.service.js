import api from './api';

const DashboardAPI = {
  async getDashboardStats() {
    // Backend exposes GET /api/analytics/dashboard
    // Add timestamp to prevent caching
    const response = await api.get('/analytics/dashboard', { params: { t: Date.now() } });
    return response.data;
  },
};

export default DashboardAPI;
