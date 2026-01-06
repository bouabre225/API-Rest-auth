import { describe, test, expect, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { registerValidation } from '#middlewares/registerValidation.middleware';
import { registerSchema } from '#dto/register.dto';

describe('Register DTO validation', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post('/register', registerValidation(registerSchema), (req, res) =>
      res.sendStatus(200)
    );
  });

  test('should reject invalid email', async () => {
    const res = await request(app).post('/register').send({
      email: 'test',
      password: 'motDePasse',
      firstName: 'Florent',
      lastName: 'BOUDZOUMOU'
    });
    expect(res.status).toBe(422);
  });

  test('should reject if password is short', async () => {
    const res = await request(app).post('/register').send({
      email: 'test',
      firstName: 'Florent',
      lastName: 'BOUDZOUMOU'
    });
    expect(res.status).toBe(422);
  });
  
  test('should accept valid payload', async () => {
    const res = await request(app).post('/register').send({
      email: 'test@test.test',
      password: 'motDePasse',
      firstName: 'Florent',
      lastName: 'BOUDZOUMOU'
    });
    expect(res.status).toBe(200);
  });
});