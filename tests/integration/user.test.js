const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('User Profile Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'testprofile@example.com',
        password: hashedPassword,
        name: 'Test Profile User'
      }
    });

    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /user/profile', () => {
    it('devrait retourner le profil de l\'utilisateur', async () => {
      const response = await request(app)
        .get('/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('testprofile@example.com');
      expect(response.body.name).toBe('Test Profile User');
      expect(response.body).not.toHaveProperty('password');
    });

    it('devrait échouer sans token', async () => {
      const response = await request(app)
        .get('/user/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /user/profile', () => {
    it('devrait mettre à jour le nom', async () => {
      const response = await request(app)
        .put('/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Updated Name');
    });

    it('devrait mettre à jour l\'email', async () => {
      const response = await request(app)
        .put('/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('newemail@example.com');
      expect(response.body.user.emailVerified).toBe(false);
    });

    it('devrait échouer si l\'email est déjà utilisé', async () => {
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: await bcrypt.hash('pass', 10),
          name: 'Existing'
        }
      });

      const response = await request(app)
        .put('/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'existing@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('déjà utilisé');
    });
  });

  describe('DELETE /user/account', () => {
    it('devrait désactiver le compte avec mot de passe correct', async () => {
      const response = await request(app)
        .delete('/user/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('désactivé avec succès');

      const user = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(user.disabledAt).not.toBeNull();
    });

    it('devrait échouer avec mauvais mot de passe', async () => {
      const response = await request(app)
        .delete('/user/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'wrongpassword' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('incorrect');
    });

    it('devrait échouer sans mot de passe', async () => {
      const response = await request(app)
        .delete('/user/account')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('requis');
    });
  });

  describe('GET /user/export', () => {
    it('devrait exporter toutes les données utilisateur', async () => {
      await prisma.refreshToken.create({
        data: {
          userId: testUser.id,
          token: 'refresh_token_123',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          device: 'Chrome',
          ipAddress: '127.0.0.1'
        }
      });

      await prisma.loginHistory.create({
        data: {
          userId: testUser.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          success: true
        }
      });

      const response = await request(app)
        .get('/user/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('loginHistory');
      expect(response.body).toHaveProperty('exportedAt');
      expect(response.body.user.email).toBe('testprofile@example.com');
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.loginHistory).toHaveLength(1);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('twoFactorSecret');
    });

    it('devrait limiter l\'historique des connexions à 50 entrées', async () => {
      for (let i = 0; i < 60; i++) {
        await prisma.loginHistory.create({
          data: {
            userId: testUser.id,
            ipAddress: `127.0.0.${i}`,
            userAgent: 'Test Agent',
            success: true
          }
        });
      }

      const response = await request(app)
        .get('/user/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.loginHistory.length).toBeLessThanOrEqual(50);
    });
  });
});
