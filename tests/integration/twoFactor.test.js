const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

describe('2FA Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    await prisma.backupCode.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        email: 'test2fa@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuv',
        name: 'Test User'
      }
    });

    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.backupCode.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /2fa/enable', () => {
    it('devrait initialiser le 2FA avec succès', async () => {
      const response = await request(app)
        .post('/2fa/enable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('backupCodes');
      expect(response.body.backupCodes).toHaveLength(10);
    });

    it('devrait échouer si 2FA déjà activé', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { twoFactorEnabled: true, twoFactorSecret: 'SECRET' }
      });

      const response = await request(app)
        .post('/2fa/enable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('déjà activé');
    });
  });

  describe('POST /2fa/confirm', () => {
    it('devrait confirmer le 2FA avec un code valide', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      await prisma.user.update({
        where: { id: testUser.id },
        data: { twoFactorSecret: secret.base32 }
      });

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/2fa/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('activé avec succès');

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.twoFactorEnabled).toBe(true);
    });

    it('devrait échouer avec un code invalide', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      await prisma.user.update({
        where: { id: testUser.id },
        data: { twoFactorSecret: secret.base32 }
      });

      const response = await request(app)
        .post('/2fa/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('invalide');
    });
  });

  describe('POST /2fa/disable', () => {
    it('devrait désactiver le 2FA avec password et code valides', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret.base32,
          password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Oz6zDKiZ5Z8TqKvY8lqsm' // "password123"
        }
      });

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/2fa/disable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123', token });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('désactivé avec succès');

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.twoFactorEnabled).toBe(false);
      expect(updatedUser.twoFactorSecret).toBeNull();
    });

    it('devrait échouer avec un mauvais mot de passe', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret.base32
        }
      });

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/2fa/disable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'wrongpassword', token });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Mot de passe incorrect');
    });
  });

  describe('POST /2fa/verify', () => {
    it('devrait vérifier un code valide', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret.base32
        }
      });

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/2fa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Code valide');
    });

    it('devrait rejeter un code invalide', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret.base32
        }
      });

      const response = await request(app)
        .post('/2fa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Code invalide');
    });
  });

  describe('Backup Codes', () => {
    it('devrait créer 10 codes de backup lors de l\'activation', async () => {
      const response = await request(app)
        .post('/2fa/enable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.backupCodes).toHaveLength(10);

      const backupCodes = await prisma.backupCode.findMany({
        where: { userId: testUser.id }
      });
      expect(backupCodes).toHaveLength(10);
    });

    it('devrait valider un code de backup', async () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const backupCode = 'BACKUP123';
      const bcrypt = require('bcrypt');
      const hashedCode = await bcrypt.hash(backupCode, 10);

      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret.base32
        }
      });

      await prisma.backupCode.create({
        data: {
          userId: testUser.id,
          code: hashedCode
        }
      });

      const twoFactorService = require('../../src/services/twoFactorService');
      const isValid = await twoFactorService.verifyBackupCode(testUser.id, backupCode);

      expect(isValid).toBe(true);

      const usedCode = await prisma.backupCode.findFirst({
        where: { userId: testUser.id, used: true }
      });
      expect(usedCode).toBeTruthy();
    });
  });
});
