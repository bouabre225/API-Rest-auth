import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import cors from 'cors';
import helmet from 'helmet';

describe('Security Headers (CORS + Helmet)', () => {
  let app;
  
  before(() => {
    app = express();
    app.use(cors());
    app.use(helmet());
    app.get('/', (req, res) => res.send('OK'));
  });

  test('should have CORS headers', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['access-control-allow-origin']);
  });
  
  test('should have security headers from Helmet', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['x-content-type-options']);
    assert.ok(res.headers['x-frame-options']);
  });
});