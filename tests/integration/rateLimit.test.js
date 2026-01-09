import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { setupDatabase } from './setup.js';

describe('Rate Limiting - General Limiter', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  test('should allow requests under the limit', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  test('should include rate limit headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['ratelimit-limit']).toBeTruthy();
    expect(res.headers['ratelimit-remaining']).toBeTruthy();
  });
});

describe('Rate Limiting - Authentication Limiter', () => {
  test('should allow first login attempt', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'wrongpassword'
      });
    
    if (![401, 400].includes(res.status)) {
      console.log('Unexpected status:', res.status, 'Body:', res.body);
    }
    
    expect([401, 400].includes(res.status)).toBe(true);
  });

  test('should rate limit after multiple failed login attempts', async () => {
    const email = `ratelimit-${Date.now()}@example.com`;
    const loginAttempt = () => request(app)
      .post('/api/users/login')
      .send({
        email,
        password: 'wrongpassword'
      });

    // Make 10 failed attempts to exceed the rate limit (max: 10 in test mode)
    for (let i = 0; i < 10; i++) {
      await loginAttempt();
    }

    // The 11th attempt should be rate limited
    const res = await loginAttempt();
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });

  test('should include rate limit headers on auth routes', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });
    
    expect(res.headers['ratelimit-limit']).toBeDefined();
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
    
    expect(res.status).not.toBe(429);
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

    // Make 10 registrations to exceed the rate limit (max: 10 in test mode)
    for (let i = 0; i < 10; i++) {
      await registerAttempt(i);
    }

    // The 11th attempt should be rate limited
    const res = await registerAttempt(999);
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});

describe('Rate Limiting - Headers Validation', () => {
  test('should return standard rate limit headers', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['ratelimit-limit']).toBeTruthy();
    expect(res.headers['ratelimit-remaining']).toBeTruthy();
    expect(res.headers['ratelimit-reset']).toBeTruthy();
  });

  test('should not return legacy X-RateLimit headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
  });

  test('should show decreasing remaining count', async () => {
    const res1 = await request(app).get('/');
    const remaining1 = parseInt(res1.headers['ratelimit-remaining']);
    
    const res2 = await request(app).get('/');
    const remaining2 = parseInt(res2.headers['ratelimit-remaining']);
    
    expect(remaining2).toBeLessThan(remaining1);
  });
});
