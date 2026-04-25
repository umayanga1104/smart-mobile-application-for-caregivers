// tests/integration/backend-ml.test.js
// ─── IT-03 – Backend → FastAPI Stress Prediction ML service ──────────────────
// The ML service runs in Docker so we mock fetch and verify:
//   1. The correct payload is forwarded to the ML service
//   2. The prediction is returned to the caller
//   3. A health snapshot is auto-saved after a successful prediction
//   4. Validation errors are returned before the ML service is even called

jest.mock('../../src/models/HealthSnapshot.js', () => ({
  __esModule: true,
  HealthSnapshot: { create: jest.fn() },
}));

global.fetch = jest.fn();

import { HealthSnapshot } from '../../src/models/HealthSnapshot.js';
import request            from 'supertest';
import { createTestApp } from '../helpers/testApp.js';

let app;

beforeAll(() => { app = createTestApp(); });

beforeEach(() => {
  jest.clearAllMocks();
  HealthSnapshot.create.mockResolvedValue({ _id: 'snap-123' });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const validHR = (n = 15) => Array.from({ length: n }, (_, i) => 65 + (i % 30));

const ML_RESPONSE = {
  label:        'Moderate Stress',
  stress_score: 55,
  confidence:   0.79,
  context_rule: null,
};

const mockMLOk = () =>
  global.fetch.mockResolvedValueOnce({
    ok:     true,
    status: 200,
    json:   async () => ML_RESPONSE,
  });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('IT-03 Backend → ML Service: Stress Prediction integration', () => {

  it('IT-03: forwards HR array to ML service and returns prediction JSON', async () => {
    mockMLOk();

    const res = await request(app)
      .post('/api/v2/stress/predict')
      .send({ heartRate: validHR(15), steps: 2500 })
      .expect(200);

    expect(res.body.label).toBe('Moderate Stress');
    expect(res.body.stress_score).toBe(55);
    expect(res.body.confidence).toBe(0.79);

    // Verify the correct ML endpoint was hit
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/predict$/);
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body);
    expect(body.heartRate).toHaveLength(15);
    expect(body.steps).toBe(2500);
  });

  it('IT-03b: auto-saves HealthSnapshot after successful prediction', async () => {
    mockMLOk();

    await request(app)
      .post('/api/v2/stress/predict')
      .send({ heartRate: validHR(15) })
      .expect(200);

    expect(HealthSnapshot.create).toHaveBeenCalledTimes(1);
    expect(HealthSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firebaseUID:  'test-uid-123',
        stressLabel:  'Moderate Stress',
        stressScore:  55,
      })
    );
  });

  it('IT-03c: filters out physiologically invalid HR readings before forwarding', async () => {
    mockMLOk();

    // Mix valid (70 bpm) with invalid (0 and 999 bpm)
    const mixedHR = [
      ...Array(10).fill(70), // 10 valid
      0, 999, 0, 999,        // 4 invalid (filtered)
    ];

    await request(app)
      .post('/api/v2/stress/predict')
      .send({ heartRate: mixedHR })
      .expect(200);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    // Only the 10 valid readings should be forwarded
    expect(body.heartRate.every((hr) => hr >= 30 && hr <= 220)).toBe(true);
    expect(body.heartRate).toHaveLength(10);
  });

  it('IT-03d: returns 400 when fewer than 10 valid HR values provided', async () => {
    const res = await request(app)
      .post('/api/v2/stress/predict')
      .send({ heartRate: [70, 72, 68] }) // only 3 values
      .expect(400);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.body.error).toMatch(/heart rate/i);
  });

  it('IT-03e: returns 503 when the ML service is unreachable (ECONNREFUSED)', async () => {
    const connErr = Object.assign(new Error('ECONNREFUSED'), {
      cause: { code: 'ECONNREFUSED' },
    });
    global.fetch.mockRejectedValueOnce(connErr);

    const res = await request(app)
      .post('/api/v2/stress/predict')
      .send({ heartRate: validHR(15) })
      .expect(503);

    expect(res.body.error).toMatch(/unavailable/i);
  });

  it('IT-03f: propagates non-OK ML service response (e.g. 422) back to client', async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     false,
      status: 422,
      json:   async () => ({ detail: 'Feature extraction failed' }),
    });

    const res = await request(app)
      .post('/api/v2/stress/predict')
      .send({ heartRate: validHR(15) })
      .expect(422);

    expect(res.body.error).toMatch(/Feature extraction/i);
  });
});
