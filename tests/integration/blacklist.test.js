import { describe, test, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { setupDatabase } from './setup.js';
import app from '../../src/app.js';
import { prisma } from '#lib/prisma';
import { BlacklistService } from '#services/blacklist.service';

describe('Token Blacklist', () => {
  before(async () => {
    setupDatabase();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test('should blacklist token on logout', async () => {
    const email = `blacklist-logout-${Date.now()}@example.com`;
    
    // Register and login
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Blacklist',
        lastName: 'Test'
      });

    const accessToken = registerRes.body.data?.accessToken;
    const refreshToken = registerRes.body.data?.refreshToken;

    // Logout (should blacklist the token)
    const logoutRes = await request(app)
      .post('/api/users/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    assert.strictEqual(logoutRes.status, 200);

    // Try to use the blacklisted token
    const protectedRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(protectedRes.status, 401);
    assert.ok(protectedRes.body.error.includes('revoked') || protectedRes.body.error.includes('Invalid'));
  });

  test('should prevent access with blacklisted token', async () => {
    const email = `blacklist-prevent-${Date.now()}@example.com`;
    
    // Register
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Prevent',
        lastName: 'Test'
      });

    const token = registerRes.body.data?.accessToken;

    // Manually blacklist the token
    const { verifyToken } = await import('#lib/jwt');
    const payload = await verifyToken(token);
    await BlacklistService.addToBlacklist(token, payload.userId, new Date(payload.exp * 1000));

    // Try to access protected route
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 401);
  });

  test('should check if token is blacklisted', async () => {
    const token = 'test-token-' + Date.now();
    const userId = 'test-user-id';
    const expiresAt = new Date(Date.now() + 3600000);

    // Token should not be blacklisted initially
    const isBlacklistedBefore = await BlacklistService.isBlacklisted(token);
    assert.strictEqual(isBlacklistedBefore, false);

    // Add to blacklist
    await BlacklistService.addToBlacklist(token, userId, expiresAt);

    // Token should now be blacklisted
    const isBlacklistedAfter = await BlacklistService.isBlacklisted(token);
    assert.strictEqual(isBlacklistedAfter, true);
  });

  test('should revoke refresh token', async () => {
    const email = `blacklist-revoke-${Date.now()}@example.com`;
    
    // Register
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Revoke',
        lastName: 'Test'
      });

    const refreshToken = registerRes.body.data?.refreshToken;

    // Revoke the refresh token
    await BlacklistService.revokeRefreshToken(refreshToken);

    // Verify it's revoked in database
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    assert.ok(token.revokedAt !== null);
  });

  test('should revoke all user tokens', async () => {
    const email = `blacklist-revoke-all-${Date.now()}@example.com`;
    
    // Register
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password: 'password123',
        firstName: 'RevokeAll',
        lastName: 'Test'
      });

    const userId = registerRes.body.data?.user.id;

    // Login multiple times to create multiple tokens
    await request(app)
      .post('/api/users/login')
      .send({ email, password: 'password123' });

    // Revoke all tokens
    const count = await BlacklistService.revokeAllUserTokens(userId);
    assert.ok(count >= 1);

    // Verify all tokens are revoked
    const activeTokens = await prisma.refreshToken.count({
      where: {
        userId,
        revokedAt: null
      }
    });

    assert.strictEqual(activeTokens, 0);
  });
});

describe('Token Cleanup Job', () => {
  test('should clean up expired blacklisted tokens', async () => {
    const expiredToken = 'expired-token-' + Date.now();
    const userId = 'test-user';
    const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago

    // Add expired token to blacklist
    await BlacklistService.addToBlacklist(expiredToken, userId, expiredDate);

    // Run cleanup
    const result = await BlacklistService.cleanupExpiredTokens();

    assert.ok(typeof result.deletedAccessTokens === 'number');
    assert.ok(result.total >= 0);
  });

  test('should clean up old login history', async () => {
    const count = await BlacklistService.cleanupOldLoginHistory();
    assert.ok(typeof count === 'number');
  });

  test('should get blacklist statistics', async () => {
    const stats = await BlacklistService.getBlacklistStats();
    
    assert.ok(typeof stats.blacklistedAccessTokens === 'number');
    assert.ok(typeof stats.revokedRefreshTokens === 'number');
  });
});

describe('Admin Endpoints', () => {
  let adminToken;

  before(async () => {
    // Create admin user
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User'
      });

    adminToken = registerRes.body.data?.accessToken;
  });

  test('should get blacklist stats', async () => {
    const res = await request(app)
      .get('/api/admin/blacklist/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(typeof res.body.data.blacklistedAccessTokens === 'number');
    assert.ok(typeof res.body.data.revokedRefreshTokens === 'number');
  });

  test('should run manual cleanup', async () => {
    const res = await request(app)
      .post('/api/admin/cleanup')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(res.body.data);
  });

  test('should require authentication for admin routes', async () => {
    const res = await request(app).get('/api/admin/blacklist/stats');
    assert.strictEqual(res.status, 401);
  });
});
