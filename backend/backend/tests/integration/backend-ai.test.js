// tests/integration/backend-ai.test.js
// ─── IT-04 – Backend → AI Service (Groq / custom AI service) ─────────────────
// The ai-service runs in Docker so we mock fetch and verify:
//   1. Chat messages are correctly forwarded with user context
//   2. Health tips are generated for valid categories
//   3. Conversation management (delete) works correctly
//   4. Timeout and connection errors are handled gracefully

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

import * as healthStatsModule from '../../src/services/healthStatsService.js';
import request                from 'supertest';
import { createTestApp }      from '../helpers/testApp.js';

const mockBuildUserContext = healthStatsModule.buildUserContext;

let app;

beforeAll(() => { app = createTestApp(); });

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildUserContext.mockResolvedValue(null); // no health context by default
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockAiOk = (payload) =>
  global.fetch.mockResolvedValueOnce({
    ok:     true,
    status: 200,
    json:   async () => payload,
  });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('IT-04 Backend → AI Service: Chat integration', () => {

  it('IT-04: sends chat message to AI service and returns assistant response', async () => {
    const AI_REPLY = { conversation_id: 'conv-1', reply: 'Stay calm and rest.' };
    mockAiOk(AI_REPLY);

    const res = await request(app)
      .post('/api/v2/ai/chat')
      .send({ message: 'I feel overwhelmed as a caregiver' })
      .expect(200);

    expect(res.body.reply).toBe('Stay calm and rest.');

    // Check what was sent to the AI service
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/chat/');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body);
    expect(body.message).toBe('I feel overwhelmed as a caregiver');
    expect(body.user_id).toBe('test-uid-123');
  });

  it('IT-04b: includes conversation_id in payload when continuing a conversation', async () => {
    mockAiOk({ conversation_id: 'conv-existing', reply: 'Continuing…' });

    await request(app)
      .post('/api/v2/ai/chat')
      .send({ message: 'Follow-up question', conversation_id: 'conv-existing' })
      .expect(200);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.conversation_id).toBe('conv-existing');
  });

  it('IT-04c: attaches user health context when buildUserContext returns data', async () => {
    const healthCtx = { avg_stress_score: 60, trend: 'worsening' };
    mockBuildUserContext.mockResolvedValueOnce(healthCtx);
    mockAiOk({ reply: 'Personalised advice…' });

    await request(app)
      .post('/api/v2/ai/chat')
      .send({ message: 'How am I doing?' })
      .expect(200);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.user_health_context).toEqual(healthCtx);
  });

  it('IT-04d: empty message → 400 Bad Request, AI service never called', async () => {
    const res = await request(app)
      .post('/api/v2/ai/chat')
      .send({ message: '' })
      .expect(400);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.body.error).toMatch(/Message/i);
  });

  it('IT-04e: AI service timeout → 504', async () => {
    const abortErr = Object.assign(new Error('AbortError'), { name: 'AbortError' });
    global.fetch.mockRejectedValueOnce(abortErr);

    const res = await request(app)
      .post('/api/v2/ai/chat')
      .send({ message: 'Hello' })
      .expect(504);

    expect(res.body.error).toMatch(/too long/i);
  });

  it('IT-04f: AI service ECONNREFUSED → 503', async () => {
    const connErr = Object.assign(new Error('connect ECONNREFUSED'), {
      cause: { code: 'ECONNREFUSED' },
    });
    global.fetch.mockRejectedValueOnce(connErr);

    const res = await request(app)
      .post('/api/v2/ai/chat')
      .send({ message: 'Hello' })
      .expect(503);

    expect(res.body.error).toMatch(/unavailable/i);
  });
});

describe('IT-04 Backend → AI Service: Health Tips integration', () => {
  it('IT-04g: generates stress_management tips for a valid category', async () => {
    const TIPS = { tips: ['Breathe deeply', 'Take a short walk', 'Call a friend'] };
    mockAiOk(TIPS);

    const res = await request(app)
      .post('/api/v2/ai/tips')
      .send({ category: 'stress_management', count: 3 })
      .expect(200);

    expect(res.body.tips).toHaveLength(3);

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/tips');
    const body = JSON.parse(init.body);
    expect(body.category).toBe('stress_management');
    expect(body.count).toBe(3);
  });

  it('IT-04h: missing category → 400, AI service never called', async () => {
    const res = await request(app)
      .post('/api/v2/ai/tips')
      .send({})
      .expect(400);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.body.error).toMatch(/Category/i);
  });
});

describe('IT-04 Backend → AI Service: Conversation deletion', () => {
  it('IT-04i: deletes a conversation and returns SUCCESS', async () => {
    mockAiOk({ detail: 'Deleted' });

    const res = await request(app)
      .delete('/api/v2/ai/chat/conv-999')
      .expect(200);

    expect(res.body.code).toBe('SUCCESS');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('conv-999');
  });
});
