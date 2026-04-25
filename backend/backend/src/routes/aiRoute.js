// src/routes/aiRoute.js
import { Router } from 'express';
import aiService from '../services/aiService.js';

export const aiRouter = Router();

// ── Chat ──
// POST /api/v2/ai/chat          → Send message / start or continue conversation
// DELETE /api/v2/ai/chat/:id    → Delete a conversation
aiRouter.post('/chat', aiService.sendMessage);
aiRouter.delete('/chat/:conversationId', aiService.deleteConversation);

// ── Tips ──
// POST /api/v2/ai/tips          → Generate caregiving tips
aiRouter.post('/tips', aiService.generateTips);

// ── Health ──
// GET /api/v2/ai/health         → Check AI service status
aiRouter.get('/health', aiService.healthCheck);