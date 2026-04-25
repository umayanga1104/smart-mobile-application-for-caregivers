import { api } from '../config/axios';

/**
 * Health Statistics Service
 * Fetches aggregated health data and trends for the profile page.
 */
const healthStatsService = {
  /**
   * Get aggregated health statistics for the current user.
   * Returns stress averages, trends, distributions, heart rate, steps, insights.
   */
  getStats: async () => {
    try {
      const response = await api.get('/health/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch health stats:', error);
      throw error;
    }
  },

  /**
   * Manually save a health snapshot (normally auto-saved on stress prediction).
   */
  saveSnapshot: async (data) => {
    try {
      const response = await api.post('/health/snapshot', data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to save health snapshot:', error);
      throw error;
    }
  },
};

export default healthStatsService;
