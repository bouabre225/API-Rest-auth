import { describe, test, expect, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '#middlewares/error-handler';

describe('Error handler', () => {
  let app;
  
  beforeAll(() => {
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
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Test error');
  });
});