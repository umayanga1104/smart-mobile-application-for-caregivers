// tests/unit/stress.service.test.js
// ─── UT-09, UT-10 – Stress Controller ────────────────────────────────────────

jest.mock('../../src/models/HealthSnapshot.js', () => ({
  __esModule: true,
  HealthSnapshot: { create: jest.fn() },
}));

// Mock the global fetch used by stressService
global.fetch = jest.fn();

import { HealthSnapshot } from '../../src/models/HealthSnapshot.js';
import stressService      from '../../src/services/stressService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (overrides = {}) => ({
  firebaseUser: { uid: 'user-123' },
  body: {},
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

/** Build an array of N valid heart-rate values (all in 30–220 bpm range) */
const validHR = (n = 15) => Array.from({ length: n }, (_, i) => 60 + (i % 40));

const MOCK_ML_RESPONSE = {
  label:        'Low Stress',
  stress_score: 20,
  confidence:   0.88,
  context_rule: null,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Stress Service – Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    HealthSnapshot.create.mockResolvedValue({ _id: 'snap-id' });
  });

  // UT-09 ─────────────────────────────────────────────────────────────────────
  it('UT-09: valid HR array → calls ML service → returns prediction with label', async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     true,
      status: 200,
      json:   async () => MOCK_ML_RESPONSE,
    });

    const req = makeReq({ body: { heartRate: validHR(15) } });
    const res = makeRes();

    await stressService.predictStress(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/predict'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Low Stress', stress_score: 20 })
    );
  });

  // UT-10 ─────────────────────────────────────────────────────────────────────
  it('UT-10: empty HR array → 400 Bad Request without calling ML service', async () => {
    const req = makeReq({ body: { heartRate: [] } });
    const res = makeRes();

    await stressService.predictStress(req, res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('heart rate') })
    );
  });

  it('UT-10b: HR array with fewer than 10 valid readings → 400 Bad Request', async () => {
    // All out-of-range (e.g. 0 bpm) so validHR count < 10
    const req = makeReq({ body: { heartRate: [0, 0, 0, 0, 0] } });
    const res = makeRes();

    await stressService.predictStress(req, res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('UT-09b: ML service error propagated correctly → returns ML status code', async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     false,
      status: 422,
      json:   async () => ({ detail: 'Unprocessable Entity' }),
    });

    const req = makeReq({ body: { heartRate: validHR(15) } });
    const res = makeRes();

    await stressService.predictStress(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
  });
});
