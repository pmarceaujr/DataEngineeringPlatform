import api from './api';

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getActivity(limit = 10) {
    try {
      const response = await api.get('/dashboard/activity', {
        params: { limit }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get execution trend
   */
  async getTrend() {
    try {
      const response = await api.get('/dashboard/trend');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

const dashboardServiceInstance = new DashboardService();
export default dashboardServiceInstance;