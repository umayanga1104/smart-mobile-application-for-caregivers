import { api } from '../config/axios';

/**
 * Stress Prediction Service
 * Sends health data to the Express backend, which forwards to the FastAPI ML service.
 */
const stressPredictionService = {
  /**
   * Request a stress prediction from smartwatch health data.
   * @param {Object} data
   * @param {number[]} data.heartRate  – array of BPM values (≥ 10 required)
   * @param {number}   [data.steps=0]  – step count in the last ~1 minute
   * @param {number[]} [data.skinTemperature] – optional skin temp array (°C)
   * @param {Object}   [data.accelerometer]   – optional {x:[], y:[], z:[]}
   * @returns {Promise<Object>} prediction result from the ML model
   */
  predict: async (data) => {
    try {
      const payload = {
        heartRate: data.heartRate,
        steps: data.steps || 0,
        skinTemperature: data.skinTemperature || null,
        accelerometer: data.accelerometer || null,
      };

      const response = await api.post('/stress/predict', payload);
      return response.data;
    } catch (error) {
      console.error('❌ Stress prediction request failed:', error);
      throw error;
    }
  },
};

export default stressPredictionService;