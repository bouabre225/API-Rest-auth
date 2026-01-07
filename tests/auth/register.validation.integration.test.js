const express = require('express');
const request = require('supertest');
const validate = require('../../src/lib/validate');
const { registerSchema } = require('../../src/schemas/user.schema');

describe('Register validation (integration)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post(
      '/register',
      validate(registerSchema),
      (req, res) => res.sendStatus(200)
    );
  });

  test('rejette un email invalide', async () => {
    const res = await request(app).post('/register').send({
      email: 'ric.com',
      password: 'Password',
    });

    expect(res.status).toBe(422);
  });

  test('rejette un password faible', async () => {
    const res = await request(app).post('/register').send({
      email: 'ric@mail.com',
      password: '123456',
    });

    expect(res.status).toBe(422);
  });

  test('accepte un payload valide', async () => {
    const res = await request(app).post('/register').send({
      email: 'ric@mail.com',
      password: 'Password',
    });

    expect(res.status).toBe(200);
  });
});
