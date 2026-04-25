// tests/unit/ai.service.test.js
// ─── UT-11 – AI / Health Tips + Chat ─────────────────────────────────────────

// Define mocks INSIDE the factory to avoid hoisting TDZ errors.
jest.mock('../../src/services/healthStatsService.js', () => ({
  __esModule: true,
  buildUserContext: jest.fn(),
  default: {
    saveSnapshot:      jest.fn(),
    getStats:          jest.fn(),
    getProfileContext: jest.fn(),
  },
}));

// Mock global fetch used by aiService
global.fetch = jest.fn();

import * as healthStatsModule from '../../src/services/healthStatsService.js';
import aiService              from '../../src/services/aiService.js';

// Convenience alias – stable reference from the mock module
const mockBuildUserContext = healthStatsModule.buildUserContext;

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (overrides = {}) => ({
  firebaseUser: { uid: 'user-123' },
  body:   {},
  params: {},
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const MOCK_CHAT_RESPONSE = {
  conversation_id: 'conv-abc',
  reply: 'Here is some caregiving advice…',
};

const MOCK_TIPS_RESPONSE = {
  tips: ['Tip 1', 'Tip 2'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('AI Service – Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildUserContext.mockResolvedValue(null);
  });

  // UT-11: Health Tips ─────────────────────────────────────────────────────────
  it('UT-11: stress label triggers appropriate tip from AI service', async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     true,
      status: 200,
      json:   async () => MOCK_TIPS_RESPONSE,
    });

    const req = makeReq({ body: { category: 'stress_management', context: 'High Stress', count: 3 } });
    const res = makeRes();

    await aiService.generateTips(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tips'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(MOCK_TIPS_RESPONSE);
  });

  it('UT-11b: missing category → 400 Bad Request (no AI call)', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();

    await aiService.generateTips(req, res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Category') })
    );
  });

  it('UT-11c: invalid category → 400 Bad Request', async () => {
    const req = makeReq({ body: { category: 'unknown_category' } });
    const res = makeRes();

    await aiService.generateTips(req, res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Chat ───────────────────────────────────────────────────────────────────────
  it('UT-AI-01: sendMessage with valid text → calls AI service → returns reply', async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     true,
      status: 200,
      json:   async () => MOCK_CHAT_RESPONSE,
    });

    const req = makeReq({ body: { message: 'What should I do for a stressed caregiver?' } });
    const res = makeRes();

    await aiService.sendMessage(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/chat/'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(MOCK_CHAT_RESPONSE);
  });

  it('UT-AI-02: sendMessage with empty message → 400 Bad Request', async () => {
    const req = makeReq({ body: { message: '   ' } });
    const res = makeRes();

    await aiService.sendMessage(req, res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Message') })
    );
  });

  it('UT-AI-03: AI service unavailable (ECONNREFUSED) → 503', async () => {
    const connError = Object.assign(new Error('connect ECONNREFUSED'), {
      cause: { code: 'ECONNREFUSED' },
    });
    global.fetch.mockRejectedValueOnce(connError);

    const req = makeReq({ body: { message: 'Hello' } });
    const res = makeRes();

    await aiService.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
  });
});
