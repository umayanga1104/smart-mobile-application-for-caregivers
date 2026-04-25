// tests/helpers/testApp.js
// ─── Express app factory for tests ───────────────────────────────────────────
// Mirrors server.js routes WITHOUT importing database.js or firebaseAdmin.js,
// so tests can run without a real Firebase project or MongoDB connection.
//
// Pass a custom `authMiddleware` to test specific auth scenarios (e.g. real
// verifyFirebaseToken for auth unit tests). By default it injects a mock user.

import express from 'express';
import cors from 'cors';
import { userRouter }        from '../../src/routes/userRoute.js';
import { reminderRouter }    from '../../src/routes/reminderRoute.js';
import { aiRouter }          from '../../src/routes/aiRoute.js';
import { stressRouter }      from '../../src/routes/stressRoute.js';
import { healthStatsRouter } from '../../src/routes/healthStatsRoute.js';

/** Default mock auth: injects a test Firebase user into req */
const defaultMockAuth = (req, _res, next) => {
  req.firebaseUser = { uid: 'test-uid-123', email: 'test@example.com' };
  next();
};

/**
 * @param {import('express').RequestHandler} [authMiddleware]
 * @returns {import('express').Application}
 */
export function createTestApp(authMiddleware) {
  const app = express();
  const auth = authMiddleware || defaultMockAuth;

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Health check (unauthenticated – mirrors server.js)
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api/v2/user',      auth, userRouter);
  app.use('/api/v2/reminders', auth, reminderRouter);
  app.use('/api/v2/ai',        auth, aiRouter);
  app.use('/api/v2/stress',    auth, stressRouter);
  app.use('/api/v2/health',    auth, healthStatsRouter);

  return app;
}
