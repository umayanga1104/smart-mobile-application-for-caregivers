// tests/unit/reminder.service.test.js
// ─── UT-04 … UT-08 – Reminder Controller ─────────────────────────────────────

// Define ALL jest.fn() INSIDE the factory to avoid the hoisting
// temporal-dead-zone issue with const/let.
jest.mock('../../src/models/Reminder.js', () => {
  const mockSave = jest.fn();
  const MockReminder = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id  = 'mock-reminder-id';
    this.save = mockSave;
  });
  MockReminder.__mockSave       = mockSave;   // exposed for test assertions
  MockReminder.deleteOne        = jest.fn();
  MockReminder.findOneAndUpdate = jest.fn();
  MockReminder.find             = jest.fn();
  return { Reminder: MockReminder };
});

import { Reminder }    from '../../src/models/Reminder.js';
import reminderService from '../../src/services/reminderService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const FUTURE_DATE = new Date(Date.now() + 3_600_000).toISOString(); // 1 h from now
const PAST_DATE   = new Date(Date.now() - 3_600_000).toISOString(); // 1 h ago

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

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Reminder Service – Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // UT-04 ─────────────────────────────────────────────────────────────────────
  it('UT-04: creates a reminder with valid data → 201 Created', async () => {
    Reminder.__mockSave.mockResolvedValueOnce();

    const req = makeReq({ body: { title: 'Take meds', reminderTime: FUTURE_DATE } });
    const res = makeRes();

    await reminderService.addReminder(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Take meds' })
    );
  });

  // UT-05 ─────────────────────────────────────────────────────────────────────
  it('UT-05: rejects a reminder with a past reminderTime → 400 Bad Request', async () => {
    const req = makeReq({ body: { title: 'Past reminder', reminderTime: PAST_DATE } });
    const res = makeRes();

    await reminderService.addReminder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('past') })
    );
    expect(Reminder.__mockSave).not.toHaveBeenCalled();
  });

  // UT-06 ─────────────────────────────────────────────────────────────────────
  it('UT-06: rejects a reminder with a missing title → 400 Bad Request', async () => {
    const req = makeReq({ body: { reminderTime: FUTURE_DATE } }); // no title
    const res = makeRes();

    await reminderService.addReminder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('required') })
    );
  });

  // UT-07 ─────────────────────────────────────────────────────────────────────
  it('UT-07: deletes an existing reminder → 200 OK', async () => {
    Reminder.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

    const req = makeReq({ params: { reminderId: 'mock-reminder-id' } });
    const res = makeRes();

    await reminderService.deleteReminder(req, res);

    expect(Reminder.deleteOne).toHaveBeenCalledWith({
      _id: 'mock-reminder-id',
      firebaseUID: 'user-123',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SUCCESS' })
    );
  });

  // UT-08 ─────────────────────────────────────────────────────────────────────
  it('UT-08: returns 404 when deleting a non-existent reminder', async () => {
    Reminder.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });

    const req = makeReq({ params: { reminderId: 'non-existent-id' } });
    const res = makeRes();

    await reminderService.deleteReminder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Reminder not found' })
    );
  });
});

