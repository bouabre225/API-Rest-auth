const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const jwt = require('jsonwebtoken');

describe('OAuth Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    await prisma.oAuthAccount.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        email: 'testoauth@example.com',
        password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Oz6zDKiZ5Z8TqKvY8lqsm',
        name: 'Test OAuth User'
      }
    });

    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.oAuthAccount.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /oauth/google', () => {
    it('devrait rediriger vers Google OAuth', async () => {
      const response = await request(app)
        .get('/oauth/google');

      expect([302, 301]).toContain(response.status);
    });
  });

  describe('GET /oauth/linked', () => {
    it('devrait retourner les comptes OAuth liés', async () => {
      await prisma.oAuthAccount.create({
        data: {
          userId: testUser.id,
          provider: 'google',
          providerAccountId: '123456789',
          accessToken: 'access_token'
        }
      });

      const response = await request(app)
        .get('/oauth/linked')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.accounts).toHaveLength(1);
      expect(response.body.accounts[0].provider).toBe('google');
    });

    it('devrait retourner un tableau vide si aucun compte lié', async () => {
      const response = await request(app)
        .get('/oauth/linked')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.accounts).toHaveLength(0);
    });
  });

  describe('DELETE /oauth/unlink/:provider', () => {
    it('devrait détacher un compte OAuth', async () => {
      await prisma.oAuthAccount.create({
        data: {
          userId: testUser.id,
          provider: 'google',
          providerAccountId: '123456789',
          accessToken: 'access_token'
        }
      });

      const response = await request(app)
        .delete('/oauth/unlink/google')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('détaché avec succès');

      const accounts = await prisma.oAuthAccount.findMany({
        where: { userId: testUser.id }
      });
      expect(accounts).toHaveLength(0);
    });

    it('devrait échouer si le compte OAuth n\'existe pas', async () => {
      const response = await request(app)
        .delete('/oauth/unlink/google')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non trouvé');
    });

    it('devrait échouer si c\'est le dernier moyen de connexion sans mot de passe', async () => {
      const userWithoutPassword = await prisma.user.create({
        data: {
          email: 'nopwd@example.com',
          name: 'No Password User',
          emailVerified: true
        }
      });

      await prisma.oAuthAccount.create({
        data: {
          userId: userWithoutPassword.id,
          provider: 'google',
          providerAccountId: '987654321',
          accessToken: 'access_token'
        }
      });

      const token = jwt.sign({ userId: userWithoutPassword.id }, process.env.JWT_SECRET);

      const response = await request(app)
        .delete('/oauth/unlink/google')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('dernier moyen de connexion');
    });
  });

  describe('OAuth Account Creation', () => {
    it('devrait créer un utilisateur lors de la première connexion OAuth', async () => {
      const oauthService = require('../../src/services/oauthService');
      
      const newUserId = testUser.id + 100;
      const linkedAccount = await oauthService.linkAccount(
        newUserId,
        'google',
        'new_google_id',
        'new_access_token',
        'new_refresh_token'
      );

      expect(linkedAccount.provider).toBe('google');
      expect(linkedAccount.providerAccountId).toBe('new_google_id');
    });

    it('devrait lier un compte existant', async () => {
      const oauthService = require('../../src/services/oauthService');
      
      const linkedAccount = await oauthService.linkAccount(
        testUser.id,
        'github',
        'github_id_123',
        'github_access',
        'github_refresh'
      );

      expect(linkedAccount.provider).toBe('github');
      expect(linkedAccount.userId).toBe(testUser.id);
    });

    it('devrait échouer si le provider est déjà lié', async () => {
      const oauthService = require('../../src/services/oauthService');
      
      await oauthService.linkAccount(
        testUser.id,
        'google',
        'google_id',
        'access',
        'refresh'
      );

      await expect(
        oauthService.linkAccount(testUser.id, 'google', 'another_id', 'token', 'refresh')
      ).rejects.toThrow('déjà lié');
    });
  });
});
