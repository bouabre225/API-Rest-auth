const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

describe('Password History Tests', () => {
  let accessToken;
  let userId;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('DELETE FROM "PasswordHistory"');
    await prisma.$executeRawUnsafe('DELETE FROM "RefreshToken"');
    await prisma.$executeRawUnsafe('DELETE FROM "User"');

    const hashedPassword = await bcrypt.hash('Test123!@#', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@history.com',
        password: hashedPassword,
        name: 'Test User',
        emailVerified: true,
      },
    });

    userId = user.id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@history.com', password: 'Test123!@#' });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe('DELETE FROM "PasswordHistory"');
    await prisma.$executeRawUnsafe('DELETE FROM "RefreshToken"');
    await prisma.$executeRawUnsafe('DELETE FROM "User"');
    await prisma.$disconnect();
  });

  test('Ne doit pas réutiliser un des 3 derniers passwords', async () => {
    const res = await request(app)
      .put('/auth/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'Test123!@#',
        newPassword: 'Test123!@#',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('réutiliser');
  });

  test('Doit accepter un nouveau password différent', async () => {
    const res = await request(app)
      .put('/auth/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'Test123!@#',
        newPassword: 'NewPass456!@#',
      });

    expect(res.status).toBe(200);
  });

  test('Doit limiter historique à 3 passwords', async () => {
    const history = await prisma.passwordHistory.findMany({
      where: { userId },
    });

    expect(history.length).toBeLessThanOrEqual(3);
  });
});
