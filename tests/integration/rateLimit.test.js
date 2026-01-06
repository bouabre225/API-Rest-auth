import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../src/app.js';

describe('Rate Limiting - General Limiter', () => {
  test('should allow requests under the limit', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
  });

  test('should include rate limit headers', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['ratelimit-limit'], 'RateLimit-Limit header missing');
    assert.ok(res.headers['ratelimit-remaining'], 'RateLimit-Remaining header missing');
  });
});

describe('Rate Limiting - Authentication Limiter', () => {
  test('should allow first login attempt', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    // Should get 401 (invalid credentials), not 429 (rate limited)
    assert.ok([401, 400].includes(res.status), 'Should allow first attempt');
  });

  test('should rate limit after multiple failed login attempts', async () => {
    const loginAttempt = () => request(app)
      .post('/api/users/login')
      .send({
        email: `ratelimit-${Date.now()}@example.com`,
        password: 'wrongpassword'
      });

    // Make 5 attempts (the limit)
    for (let i = 0; i < 5; i++) {
      await loginAttempt();
    }

    // 6th attempt should be rate limited
    const res = await loginAttempt();
    assert.strictEqual(res.status, 429, 'Should be rate limited after 5 attempts');
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('too many') || res.body.error.includes('Too many'), 'Error message should mention rate limit');
  });

  test('should include rate limit headers on auth routes', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });
    
    assert.ok(res.headers['ratelimit-limit'] !== undefined, 'Rate limit headers should be present');
  });
});

describe('Rate Limiting - Registration Limiter', () => {
  test('should allow first registration', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: `first-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
    
    // Should get 201 or validation error, not 429
    assert.notStrictEqual(res.status, 429, 'First registration should not be rate limited');
  });

  test('should rate limit after multiple registrations from same IP', async () => {
    const registerAttempt = (index) => request(app)
      .post('/api/users/register')
      .send({
        email: `reg-limit-${Date.now()}-${index}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    // Make 3 attempts (the limit for registration)
    for (let i = 0; i < 3; i++) {
      await registerAttempt(i);
    }

    // 4th attempt should be rate limited
    const res = await registerAttempt(999);
    assert.strictEqual(res.status, 429, 'Should be rate limited after 3 registrations');
    assert.strictEqual(res.body.success, false);
  });
});

describe('Rate Limiting - Headers Validation', () => {
  test('should return standard rate limit headers', async () => {
    const res = await request(app).get('/');
    
    // Check for standard RateLimit headers (not X-RateLimit legacy)
    assert.ok(res.headers['ratelimit-limit'], 'RateLimit-Limit header missing');
    assert.ok(res.headers['ratelimit-remaining'], 'RateLimit-Remaining header missing');
    assert.ok(res.headers['ratelimit-reset'], 'RateLimit-Reset header missing');
  });

  test('should not return legacy X-RateLimit headers', async () => {
    const res = await request(app).get('/');
    
    // Legacy headers should be disabled
    assert.strictEqual(res.headers['x-ratelimit-limit'], undefined, 'Legacy headers should be disabled');
  });

  test('should show decreasing remaining count', async () => {
    const res1 = await request(app).get('/');
    const remaining1 = parseInt(res1.headers['ratelimit-remaining']);
    
    const res2 = await request(app).get('/');
    const remaining2 = parseInt(res2.headers['ratelimit-remaining']);
    
    assert.ok(remaining2 < remaining1, 'Remaining count should decrease');
  });
});
