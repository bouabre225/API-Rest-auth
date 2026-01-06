import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { setupDatabase } from './setup.js';
import { prisma } from '#lib/prisma';
import jwt from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';
import { authMiddleware } from '#middlewares/auth.middleware';

describe('Auth Middleware', () => {
  let app;

  beforeAll(async () => {
    setupDatabase();
    process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
    app = express();
    app.get('/protected', authMiddleware, (req, res) => {
      res.status(200).send('ok');
    });

    app.get('/me', authMiddleware, (req, res) => {
      res.status(200).json(req.user);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should reject request without token', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  test('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });

  test('should reject malformed authorization header', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'InvalidFormat');
    expect(res.status).toBe(401);
  });

  test('should accept request with valid token', async () => {
    const token = jwt.sign(
      { userId: 'test-user-id', email: 'florent@test.co' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('should attach decoded user to req.user', async () => {
    const user = await prisma.user.create({
      data: {
        email: `me-test-${Date.now()}@test.co`,
        password: 'password',
        firstName: 'florent',
        lastName: 'BOUDZOUMOU'
      }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.password).toBeUndefined();
  });

  test('should reject token if user does not exist in db', async () => {
    const user = await prisma.user.create({
      data: {
        email: `deleted-${Date.now()}@test.co`,
        password: 'password',
        firstName: 'florent',
        lastName: 'BOUDZOUMOU'
      }
    });

    const token = jwt.sign({
      userId: user.id,
      email: user.email
    }, process.env.JWT_SECRET);

    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});