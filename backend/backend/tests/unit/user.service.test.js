// tests/unit/user.service.test.js
// ─── UT-12 – User Controller ──────────────────────────────────────────────────

jest.mock('../../src/models/User.js', () => {
  const mockSave = jest.fn();
  const MockUser = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id  = 'mock-user-id';
    this.save = mockSave;
  });
  MockUser.__mockSave       = mockSave;
  MockUser.findOne          = jest.fn();
  MockUser.findOneAndUpdate = jest.fn();
  return { User: MockUser };
});

import { User }    from '../../src/models/User.js';
import userService from '../../src/services/userService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeReq = (overrides = {}) => ({
  firebaseUser: { uid: 'user-123', email: 'user@example.com' },
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

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('User Service – Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // UT-12 ─────────────────────────────────────────────────────────────────────
  it('UT-12: GET /verify with valid token returns 200 + user data', async () => {
    User.findOne.mockResolvedValueOnce({
      username: 'john_doe',
      email:    'user@example.com',
      profilePicture: null,
    });

    const req = makeReq();
    const res = makeRes();

    await userService.verify(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ firebaseUID: 'user-123' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        uid:      'user-123',
        username: 'john_doe',
        email:    'user@example.com',
      })
    );
  });

  it('UT-12b: verify returns 404 when user does not exist in DB', async () => {
    User.findOne.mockResolvedValueOnce(null);

    const req = makeReq();
    const res = makeRes();

    await userService.verify(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it('UT-12c: register creates a new user when none exists → 200 OK', async () => {
    User.findOne.mockResolvedValueOnce(null); // no existing user
    User.__mockSave.mockResolvedValueOnce();

    const req = makeReq({ body: { username: 'new_user' } });
    const res = makeRes();

    await userService.register(req, res);

    expect(User.__mockSave).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'new_user', email: 'user@example.com' })
    );
  });

  it('UT-12d: register returns 400 when user already exists', async () => {
    User.findOne.mockResolvedValueOnce({ username: 'existing' });

    const req = makeReq({ body: { username: 'existing' } });
    const res = makeRes();

    await userService.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.__mockSave).not.toHaveBeenCalled();
  });
});
