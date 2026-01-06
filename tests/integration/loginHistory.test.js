import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { setupDatabase } from './setup.js';
import app from '../../src/app.js';
import { prisma } from '#lib/prisma';

describe('Login History Tracking', () => {
  before(async () => {
    setupDatabase();
  });

  test('should record successful login in history', async () => {
    const email = `history-success-${Date.now()}@example.com`;
    
    // Register user
    await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'History',
        lastName: 'Test'
      });

    // Login
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email, password: 'password123' });

    const token = loginRes.body.data?.accessToken;
    assert.ok(token, 'Should receive access token');

    // Check history
    const historyRes = await request(app)
      .get('/api/users/me/login-history')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(historyRes.status, 200);
    assert.ok(historyRes.body.success);
    assert.ok(Array.isArray(historyRes.body.data));
    assert.ok(historyRes.body.data.length > 0, 'Should have login history');
    
    const latestEntry = historyRes.body.data[0];
    assert.strictEqual(latestEntry.success, true);
    assert.ok(latestEntry.createdAt);
  });

  test('should record failed login attempts', async () => {
    const email = `history-failed-${Date.now()}@example.com`;
    
    // Register user
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Failed',
        lastName: 'Test'
      });

    const token = registerRes.body.data?.accessToken;

    // Attempt login with wrong password
    await request(app)
      .post('/api/users/login')
      .send({ email, password: 'wrongpassword' });

    // Check history
    const historyRes = await request(app)
      .get('/api/users/me/login-history')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(historyRes.status, 200);
    
    // Should have at least one failed attempt
    const failedAttempts = historyRes.body.data.filter(entry => !entry.success);
    assert.ok(failedAttempts.length > 0, 'Should have failed login attempts');
  });

  test('should include IP address and user agent in history', async () => {
    const email = `history-metadata-${Date.now()}@example.com`;
    
    // Register and get token
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Metadata',
        lastName: 'Test'
      });

    const token = registerRes.body.data?.accessToken;

    // Check history
    const historyRes = await request(app)
      .get('/api/users/me/login-history')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(historyRes.status, 200);
    
    const entries = historyRes.body.data;
    assert.ok(entries.length > 0);
    
    // Check that entries have metadata fields
    const entry = entries[0];
    assert.ok('ipAddress' in entry, 'Should have ipAddress field');
    assert.ok('userAgent' in entry, 'Should have userAgent field');
  });

  test('should limit history results based on query parameter', async () => {
    const email = `history-limit-${Date.now()}@example.com`;
    
    // Register
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Limit',
        lastName: 'Test'
      });

    const token = registerRes.body.data?.accessToken;

    // Login multiple times to create history
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email, password: 'password123' });
    }

    // Get limited history
    const historyRes = await request(app)
      .get('/api/users/me/login-history?limit=2')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(historyRes.status, 200);
    assert.ok(historyRes.body.data.length <= 2, 'Should respect limit parameter');
  });

  test('should return failed attempts count', async () => {
    const email = `history-count-${Date.now()}@example.com`;
    
    // Register
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Count',
        lastName: 'Test'
      });

    const token = registerRes.body.data?.accessToken;

    // Make some failed attempts
    for (let i = 0; i < 2; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email, password: 'wrongpassword' });
    }

    // Get failed attempts count
    const countRes = await request(app)
      .get('/api/users/me/failed-attempts')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(countRes.status, 200);
    assert.ok(countRes.body.success);
    assert.ok(typeof countRes.body.data.count === 'number');
    assert.strictEqual(countRes.body.data.timeWindowMinutes, 15);
  });

  test('should require authentication to view history', async () => {
    const res = await request(app).get('/api/users/me/login-history');
    
    assert.strictEqual(res.status, 401, 'Should require authentication');
  });

  test('should order history by most recent first', async () => {
    const email = `history-order-${Date.now()}@example.com`;
    
    // Register and get token
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Order',
        lastName: 'Test'
      });

    const token = registerRes.body.data?.accessToken;

    // Login multiple times
    await request(app)
      .post('/api/users/login')
      .send({ email, password: 'password123' });
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    
    await request(app)
      .post('/api/users/login')
      .send({ email, password: 'password123' });

    // Get history
    const historyRes = await request(app)
      .get('/api/users/me/login-history')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(historyRes.status, 200);
    
    const entries = historyRes.body.data;
    if (entries.length > 1) {
      const date1 = new Date(entries[0].createdAt);
      const date2 = new Date(entries[1].createdAt);
      assert.ok(date1 >= date2, 'Should be ordered by most recent first');
    }
  });
});
