import { api } from '../config/axios';

/**
 * AI Assistant Service
 * Handles all AI assistant related API calls
 */
const assistantService = {
  /**
   * Send a message to the AI assistant
   * @param {string} message - The user's message
   * @param {string} [conversationId] - Optional conversation ID for continuing a chat
   * @returns {Promise<Object>} - Response with AI message and conversation_id
   */
  sendMessage: async (message, conversationId = null) => {
    try {
      const payload = {
        message: message,
      };

      // Include conversation_id if continuing an existing conversation
      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const response = await api.post('/ai/chat', payload);
      return response.data;
    } catch (error) {
      // Silently throw - calling component handles errors
      throw error;
    }
  },

  /**
   * Delete a conversation
   * @param {string} conversationId - The conversation ID to delete
   * @returns {Promise<Object>} - Success response
   */
  deleteConversation: async (conversationId) => {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await api.delete(`/ai/chat/${conversationId}`);
      return response.data;
    } catch (error) {
      // Silently throw - calling component handles errors
      throw error;
    }
  },

  /**
   * Generate caregiving tips based on category
   * @param {string} category - Tip category (e.g., 'self_care', 'stress_management', 'patient_care')
   * @param {Object} [options] - Optional parameters
   * @param {string} [options.context] - Additional context for personalized tips
   * @param {number} [options.count] - Number of tips to generate (default: 5)
   * @returns {Promise<Object>} - Response with generated tips
   */
  generateTips: async (category, options = {}) => {
    try {
      if (!category) {
        throw new Error('Category is required');
      }

      const payload = {
        category: category,
        count: options.count || 5,
      };

      // Include optional context for personalized tips
      if (options.context) {
        payload.context = options.context;
      }

      const response = await api.post('/ai/tips', payload);
      return response.data;
    } catch (error) {
      // Silently throw - frontend handles with fallback tips
      throw error;
    }
  },

  /**
   * Check if AI service is healthy and available
   * @returns {Promise<Object>} - Health status of backend and AI service
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/ai/health');
      return response.data;
    } catch (error) {
      // Silently throw - this is optional health check
      throw error;
    }
  },

  /**
   * Get available tip categories
   * @returns {Array<string>} - List of valid categories
   */
  getAvailableCategories: () => {
    return [
      'self_care',
      'stress_management',
      'patient_care',
      'nutrition',
      'sleep',
      'communication',
      'daily_routine',
      'emotional_wellbeing',
      'exercise',
    ];
  },
};

export default assistantService;
