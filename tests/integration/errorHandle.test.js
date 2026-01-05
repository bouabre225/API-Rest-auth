import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '#middlewares/error-handler';

describe('Error handler', () => {
  let app;
  
  before(() => {
    app = express();
    app.get('/error', (req, res, next) => {
      const err = new Error('Test error');
      err.statusCode = 500;
      next(err);
    });
    app.use(errorHandler);
  });
  
  test('should catch thrown errors and return an appropriate status', async () => {
    const res = await request(app).get('/error');
    assert.strictEqual(res.status, 500);
    assert.strictEqual(res.body.error, 'Test error');
  });
});