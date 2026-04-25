// tests/integration/backend-db.test.js
// ─── IT-02 – Backend → MongoDB ────────────────────────────────────────────────
// Uses mongodb-memory-server to spin up a real in-memory MongoDB instance.
// Connects mongoose, runs HTTP requests through the express app via supertest,
// and asserts that data is genuinely persisted and retrieved.

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose              from 'mongoose';
import request               from 'supertest';
import { createTestApp }     from '../helpers/testApp.js';

let mongod;
let app;

// ── Lifecycle ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createTestApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Wipe all collections between tests so they are isolated
  await Promise.all(
    Object.values(mongoose.connection.collections).map((col) => col.deleteMany({}))
  );
});

// ── Reminder CRUD ─────────────────────────────────────────────────────────────
describe('IT-02 Backend → MongoDB: Reminder persistence', () => {
  const FUTURE = () => new Date(Date.now() + 3_600_000).toISOString();

  it('saves a reminder and retrieves it back from MongoDB', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v2/reminders')
      .send({ title: 'Doctor appointment', reminderTime: FUTURE() })
      .expect(201);

    expect(createRes.body._id).toBeDefined();
    expect(createRes.body.title).toBe('Doctor appointment');

    // Read
    const getRes = await request(app)
      .get('/api/v2/reminders')
      .expect(200);

    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body).toHaveLength(1);
    expect(getRes.body[0].title).toBe('Doctor appointment');
  });

  it('deletes an existing reminder and confirms it is gone', async () => {
    // Seed one reminder
    const { body: created } = await request(app)
      .post('/api/v2/reminders')
      .send({ title: 'To delete', reminderTime: FUTURE() })
      .expect(201);

    // Delete it
    await request(app)
      .delete(`/api/v2/reminders/${created._id}`)
      .expect(200);

    // Confirm it is gone
    const getRes = await request(app).get('/api/v2/reminders').expect(200);
    expect(getRes.body).toHaveLength(0);
  });

  it('returns 404 when deleting a non-existent reminder', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/v2/reminders/${fakeId}`)
      .expect(404);

    expect(res.body.message).toBe('Reminder not found');
  });

  it('marks a reminder as complete', async () => {
    const { body: created } = await request(app)
      .post('/api/v2/reminders')
      .send({ title: 'Complete me', reminderTime: FUTURE() })
      .expect(201);

    const patchRes = await request(app)
      .patch(`/api/v2/reminders/${created._id}/complete`)
      .expect(200);

    expect(patchRes.body).toBeDefined();
  });
});

// ── User persistence ──────────────────────────────────────────────────────────
describe('IT-02 Backend → MongoDB: User persistence', () => {
  it('registers a new user and persists it to MongoDB', async () => {
    const res = await request(app)
      .post('/api/v2/user/register')
      .send({ username: 'john_caregiver' })
      .expect(200);

    expect(res.body.username).toBe('john_caregiver');
    expect(res.body.uid).toBe('test-uid-123');

    // Verify the same token can now verify the user
    const verifyRes = await request(app)
      .get('/api/v2/user/verify')
      .expect(200);

    expect(verifyRes.body.username).toBe('john_caregiver');
  });

  it('returns 400 when registering an already-registered user', async () => {
    // Register once
    await request(app)
      .post('/api/v2/user/register')
      .send({ username: 'double_register' })
      .expect(200);

    // Register again with the same Firebase UID
    const res = await request(app)
      .post('/api/v2/user/register')
      .send({ username: 'double_register' })
      .expect(400);

    expect(res.body.message).toContain('existing');
  });
});

// ── HealthSnapshot persistence ────────────────────────────────────────────────
describe('IT-02 Backend → MongoDB: HealthSnapshot persistence', () => {
  it('saves a health snapshot and retrieves aggregated stats', async () => {
    const snapshot = {
      stressScore:  45,
      stressLabel:  'Moderate Stress',
      confidence:   0.80,
      heartRate:    { mean: 78, min: 60, max: 95, count: 20 },
      steps:        3000,
    };

    const saveRes = await request(app)
      .post('/api/v2/health/snapshot')
      .send(snapshot)
      .expect(201);

    expect(saveRes.body.id).toBeDefined();
    expect(saveRes.body.message).toBe('Snapshot saved.');

    // Stats should now reflect the saved snapshot
    const statsRes = await request(app)
      .get('/api/v2/health/stats')
      .expect(200);

    expect(statsRes.body).toHaveProperty('totalPredictions');
    expect(statsRes.body.totalPredictions).toBeGreaterThanOrEqual(1);
  });
});
