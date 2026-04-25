// src/services/aiService.js

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
import { buildUserContext } from './healthStatsService.js';

const aiService = {

  // ─────────────────────────────────────────────
  // CHAT — Start new or continue conversation
  // ─────────────────────────────────────────────
  sendMessage: async (req, res) => {
    try {
      const uid = req.firebaseUser.uid;
      const { message, conversation_id } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Message is required',
        });
      }

      // Build the payload for the AI service
      const payload = {
        user_id: uid,
        message: message,
      };

      // Include conversation_id only if continuing an existing chat
      if (conversation_id) {
        payload.conversation_id = conversation_id;
      }

      // Attach user health context for personalization (non-blocking)
      try {
        const healthContext = await buildUserContext(uid);
        if (healthContext) {
          payload.user_health_context = healthContext;
        }
      } catch (ctxErr) {
        console.warn('⚠️ Could not build user health context:', ctxErr.message);
      }

      // Create an AbortController with 30 second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${AI_SERVICE_URL}/api/v1/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data;
      try {
        data = await response.json();
      } catch {
        data = { detail: 'AI service returned an invalid response' };
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.detail || 'AI service error',
        });
      }

      res.status(200).json(data);

    } catch (error) {
      console.error('AI Chat Error:', error.message);

      if (error.name === 'AbortError') {
        return res.status(504).json({
          error: 'AI service took too long to respond. Please try again.',
        });
      }

      if (error.cause?.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'AI service is currently unavailable. Please try again later.',
        });
      }

      res.status(500).json({ error: 'Failed to communicate with AI service' });
    }
  },

  // ─────────────────────────────────────────────
  // CHAT — Delete a conversation
  // ─────────────────────────────────────────────
  deleteConversation: async (req, res) => {
    try {
      const uid = req.firebaseUser.uid;
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json({
          error: 'Conversation ID is required',
        });
      }

      // Note: In production, verify conversation ownership before deletion
      // This would require a database query: const conversation = await ConversationModel.findById(conversationId);
      // if (conversation.userId !== uid) return res.status(403).json({ error: 'Unauthorized' });

      // Create an AbortController with 15 second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `${AI_SERVICE_URL}/api/v1/chat/${conversationId}?user_id=${uid}`,
        {
          method: 'DELETE',
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.detail || 'Failed to delete conversation',
        });
      }

      res.status(200).json({
        code: 'SUCCESS',
        message: 'Conversation deleted successfully',
      });

    } catch (error) {
      console.error('AI Delete Conversation Error:', error.message);

      if (error.name === 'AbortError') {
        return res.status(504).json({
          error: 'AI service took too long to respond. Please try again.',
        });
      }

      if (error.cause?.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'AI service is currently unavailable.',
        });
      }

      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  },

  // ─────────────────────────────────────────────
  // TIPS — Generate caregiving tips
  // ─────────────────────────────────────────────
  generateTips: async (req, res) => {
    try {
      const uid = req.firebaseUser.uid;
      const { category, context, count } = req.body;

      if (!category) {
        return res.status(400).json({
          error: 'Category is required',
        });
      }

      // Validate category against allowed values
      const validCategories = [
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

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        });
      }

      const payload = {
        user_id: uid,
        category: category,
        count: count || 5,
      };

      // Include optional context for personalized tips
      if (context) {
        payload.context = context;
      }

      // Enrich with user health context for personalization (non-blocking)
      try {
        const healthContext = await buildUserContext(uid);
        if (healthContext) {
          payload.context = payload.context
            ? `${payload.context}\n\n${healthContext}`
            : healthContext;
        }
      } catch (ctxErr) {
        console.warn('⚠️ Could not build user health context for tips:', ctxErr.message);
      }

      // Create an AbortController with 30 second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${AI_SERVICE_URL}/api/v1/tips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data;
      try {
        data = await response.json();
      } catch {
        data = { detail: 'AI service returned an invalid response' };
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.detail || `Failed to generate tips for category: ${category}`,
        });
      }

      res.status(200).json(data);

    } catch (error) {
      console.error('AI Tips Error:', error.message);

      if (error.name === 'AbortError') {
        return res.status(504).json({
          error: 'AI service took too long to respond. Please try again.',
        });
      }

      if (error.cause?.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'AI service is currently unavailable. Please try again later.',
        });
      }

      res.status(500).json({ error: 'Failed to generate tips' });
    }
  },

  // ─────────────────────────────────────────────
  // HEALTH — Check if AI service is alive
  // ─────────────────────────────────────────────
  healthCheck: async (req, res) => {
    try {
      // Create an AbortController with 5 second timeout for health check
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json();

      res.status(200).json({
        backend: 'healthy',
        aiService: data,
      });

    } catch (error) {
      console.error('AI Health Check Error:', error.message);
      res.status(200).json({
        backend: 'healthy',
        aiService: { status: 'unreachable', error: error.message },
      });
    }
  },
};

export default aiService;