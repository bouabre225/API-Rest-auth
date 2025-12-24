import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import helmet from 'helmet';

describe('Security Headers (CORS + Helmet)', () => {
    let app;
    before(() => {
      app = express();
      
      app.get('/', (req, res) => res.send('OK'));
    });

    test('should have CORS headers', async () => {
      const res = await request(app).get('/');

      assert.ok(res.headers['access-control-allow-origin']);
    });
    
})