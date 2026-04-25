// tests/unit/auth.middleware.test.js
// ─── UT-01, UT-02, UT-03 – Auth Middleware ───────────────────────────────────

// Define jest.fn() INSIDE the factory to avoid the hoisting temporal-dead-zone
// issue with const/let. The stable fn reference is accessed via the imported mock.
jest.mock('../../src/config/firebaseAdmin.js', () => {
  const verifyIdToken = jest.fn();
  return {
    __esModule: true,
    default: {
      auth: () => ({ verifyIdToken }),
    },
  };
});

import { verifyFirebaseToken } from '../../src/middleware/auth.js';
import admin from '../../src/config/firebaseAdmin.js';

/** Stable reference to the mocked verifyIdToken fn (same fn every call). */
const getMockVerify = () => admin.auth().verifyIdToken;

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeReq = (authHeader) => ({ headers: { authorization: authHeader } });

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Auth Middleware – verifyFirebaseToken', () => {
  beforeEach(() => jest.clearAllMocks());

  // UT-01 ─────────────────────────────────────────────────────────────────────
  it('UT-01: accepts a valid Firebase JWT and populates req.firebaseUser', async () => {
    const decoded = { uid: 'user-abc', email: 'test@example.com' };
    getMockVerify().mockResolvedValueOnce(decoded);

    const req  = makeReq('Bearer valid-token');
    const res  = makeRes();
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next);

    expect(getMockVerify()).toHaveBeenCalledWith('valid-token');
    expect(req.firebaseUser).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  // UT-02 ─────────────────────────────────────────────────────────────────────
  it('UT-02: rejects an expired JWT with 401 Unauthorised', async () => {
    getMockVerify().mockRejectedValueOnce(
      Object.assign(new Error('Token expired'), { code: 'auth/id-token-expired' })
    );

    const req  = makeReq('Bearer expired-token');
    const res  = makeRes();
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid token' }));
    expect(next).not.toHaveBeenCalled();
  });

  // UT-03 ─────────────────────────────────────────────────────────────────────
  it('UT-03: rejects a request with no Authorization header with 401', async () => {
    const req  = { headers: {} }; // no authorization header
    const res  = makeRes();
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No token provided' })
    );
    expect(getMockVerify()).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
