// tests/integration/backend-api.test.js
// ─── IT-01, IT-05, IT-06 – Frontend → Backend (full API layer) ───────────────
// Simulates the requests that the React Native / Expo frontend sends.
// Uses supertest over the express app with:
//   • Real verifyFirebaseToken middleware (Firebase mocked)
//   • All Mongoose models mocked (no DB needed here)
//   • fetch mocked for outbound service calls

// ── Firebase admin mock ───────────────────────────────────────────────────────
// Define jest.fn() INSIDE factories to avoid hoisting TDZ errors with const/let.
jest.mock('../../src/config/firebaseAdmin.js', () => {
  const verifyIdToken = jest.fn();
  return {
    __esModule: true,
    default: {
      auth: () => ({ verifyIdToken }),
    },
  };
});

// ── Mongoose model mocks ──────────────────────────────────────────────────────
jest.mock('../../src/models/Reminder.js', () => {
  const mockSave = jest.fn();
  const M = jest.fn().mockImplementation(function (d) {
    Object.assign(this, d);
    this._id  = 'rem-001';
    this.save = mockSave;
  });
  M.__mockSave = mockSave;
  M.find       = jest.fn();
  M.deleteOne  = jest.fn();
  return { Reminder: M };
});

jest.mock('../../src/models/User.js', () => {
  const mockSave = jest.fn();
  const M = jest.fn().mockImplementation(function (d) {
    Object.assign(this, d);
    this._id  = 'usr-001';
    this.save = mockSave;
  });
  M.__mockSave       = mockSave;
  M.findOne          = jest.fn();
  M.findOneAndUpdate = jest.fn();
  return { User: M };
});

jest.mock('../../src/models/HealthSnapshot.js', () => ({
  __esModule: true,
  HealthSnapshot: { create: jest.fn() },
}));

jest.mock('../../src/services/healthStatsService.js', () => ({
  __esModule: true,
  buildUserContext: jest.fn(),
  default: {
    saveSnapshot:      jest.fn(),
    getStats:          jest.fn(),
    getProfileContext: jest.fn(),
  },
}));

global.fetch = jest.fn();

// ── Imports ───────────────────────────────────────────────────────────────────
import request                  from 'supertest';
import express                  from 'express';
import cors                     from 'cors';
import { verifyFirebaseToken }  from '../../src/middleware/auth.js';
import { userRouter }           from '../../src/routes/userRoute.js';
import { reminderRouter }       from '../../src/routes/reminderRoute.js';
import { aiRouter }             from '../../src/routes/aiRoute.js';
import { stressRouter }         from '../../src/routes/stressRoute.js';
import { healthStatsRouter }    from '../../src/routes/healthStatsRoute.js';
import admin                    from '../../src/config/firebaseAdmin.js';
import { Reminder }             from '../../src/models/Reminder.js';
import { User }                 from '../../src/models/User.js';
import { HealthSnapshot }       from '../../src/models/HealthSnapshot.js';
import * as healthStatsModule   from '../../src/services/healthStatsService.js';

// Stable references to the mock functions (via imported mocked modules)
const getMockVerify         = () => admin.auth().verifyIdToken;
const mockBuildUserContext  = healthStatsModule.buildUserContext;

// Build the full app with the REAL auth middleware (Firebase mocked at SDK level)
function buildFullApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/v2/user',      verifyFirebaseToken, userRouter);
  app.use('/api/v2/reminders', verifyFirebaseToken, reminderRouter);
  app.use('/api/v2/ai',        verifyFirebaseToken, aiRouter);
  app.use('/api/v2/stress',    verifyFirebaseToken, stressRouter);
  app.use('/api/v2/health',    verifyFirebaseToken, healthStatsRouter);
  return app;
}

let app;

beforeAll(() => { app = buildFullApp(); });

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildUserContext.mockResolvedValue(null);
  HealthSnapshot.create.mockResolvedValue({ _id: 'snap-001' });

  // Default: a valid decoded token
  getMockVerify().mockResolvedValue({
    uid:   'frontend-user-001',
    email: 'caregiver@example.com',
  });
});

// ── IT-01: Frontend → Backend auth token passing ──────────────────────────────
describe('IT-01 Frontend → Backend: Auth token passing', () => {

  it('IT-01: valid Bearer token is accepted and request proceeds', async () => {
    User.findOne.mockResolvedValueOnce({
      username: 'caregiver',
      email:    'caregiver@example.com',
      profilePicture: null,
    });

    const res = await request(app)
      .get('/api/v2/user/verify')
      .set('Authorization', 'Bearer valid-jwt-from-firebase')
      .expect(200);

    expect(getMockVerify()).toHaveBeenCalledWith('valid-jwt-from-firebase');
    expect(res.body.uid).toBe('frontend-user-001');
  });

  it('IT-01b: missing Authorization header → 401 Unauthorised', async () => {
    const res = await request(app)
      .get('/api/v2/user/verify')
      .expect(401); // no header at all

    expect(res.body.message).toBe('No token provided');
    expect(getMockVerify()).not.toHaveBeenCalled();
  });

  it('IT-01c: tampered / expired token → 401 Unauthorised', async () => {
    getMockVerify().mockRejectedValueOnce(new Error('Token expired'));

    const res = await request(app)
      .get('/api/v2/user/verify')
      .set('Authorization', 'Bearer expired-token')
      .expect(401);

    expect(res.body.message).toBe('Invalid token');
  });
});

// ── Unauthenticated health check (IT-05 proxy) ────────────────────────────────
describe('IT-05 Frontend → Backend: Health check endpoint', () => {
  it('IT-05: GET /health returns { status: ok } without auth', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── IT-06: End-to-end stress prediction cycle ─────────────────────────────────
describe('IT-06 End-to-End: Complete stress prediction cycle', () => {

  it('IT-06: frontend sends HR data → backend validates → ML predicts → snapshot saved → dashboard data returned', async () => {
    // ML service responds with a prediction
    global.fetch.mockResolvedValueOnce({
      ok:     true,
      status: 200,
      json:   async () => ({
        label:        'High Stress',
        stress_score: 78,
        confidence:   0.91,
        context_rule: 'Elevated HR for extended period',
      }),
    });

    const hrData = Array.from({ length: 20 }, (_, i) => 90 + (i % 20));

    const res = await request(app)
      .post('/api/v2/stress/predict')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ heartRate: hrData, steps: 500 })
      .expect(200);

    // The dashboard-ready prediction is returned
    expect(res.body.label).toBe('High Stress');
    expect(res.body.stress_score).toBe(78);

    // A health snapshot was auto-saved
    expect(HealthSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firebaseUID:  'frontend-user-001',
        stressLabel:  'High Stress',
        stressScore:  78,
      })
    );
  });
});

// ── IT-02 (reminder flow from frontend POV) ───────────────────────────────────
describe('IT-02 Frontend → Backend → Reminder CRUD', () => {
  const FUTURE = () => new Date(Date.now() + 3_600_000).toISOString();

  it('creates a reminder via the full authenticated API', async () => {
    Reminder.__mockSave.mockResolvedValueOnce();

    const res = await request(app)
      .post('/api/v2/reminders')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ title: 'Give medication', reminderTime: FUTURE() })
      .expect(201);

    expect(res.body.title).toBe('Give medication');
  });

  it('GET /api/v2/reminders returns the user reminders list', async () => {
    Reminder.find.mockResolvedValue([
      { _id: 'r1', title: 'Reminder A', reminderTime: FUTURE() },
    ]);

    const res = await request(app)
      .get('/api/v2/reminders')
      .set('Authorization', 'Bearer valid-jwt')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
