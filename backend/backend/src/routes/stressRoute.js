/*stressRoute.js*/
import { Router } from 'express';
import stressService from '../services/stressService.js';

export const stressRouter = Router();

// POST /api/v2/stress/predict → Forward health data to ML service
stressRouter.post('/predict', stressService.predictStress);