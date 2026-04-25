// src/routes/healthStatsRoute.js
import { Router } from 'express';
import healthStatsService from '../services/healthStatsService.js';

export const healthStatsRouter = Router();

// POST /api/v2/health/snapshot  → Save a health data snapshot
healthStatsRouter.post('/snapshot', healthStatsService.saveSnapshot);

// GET /api/v2/health/stats      → Get aggregated health statistics
healthStatsRouter.get('/stats', healthStatsService.getStats);

// GET /api/v2/health/context    → Get AI personalization context
healthStatsRouter.get('/context', healthStatsService.getProfileContext);
