import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { setupDatabase } from './setup.js';
import app from '../../src/app.js';
import { prisma } from '#lib/prisma';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    setupDatabase();
    process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                email: `test-${Date.now()}@example.com`,
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.firstName).toBe('John');
        expect(res.body.data.user.password).toBe(undefined);
    });

    test('should reject registration with duplicate email', async () => {
        const email = `duplicate-${Date.now()}@example.com`;
        
        await request(app)
            .post('/api/users/register')
            .send({
                email,
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        const res = await request(app)
            .post('/api/users/register')
            .send({
                email,
                password: 'password456',
                firstName: 'Jane',
                lastName: 'Smith'
            });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    test('should reject registration with invalid email', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                email: 'invalid-email',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('should reject registration with short password', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                email: `test-${Date.now()}@example.com`,
                password: 'short',
                firstName: 'John',
                lastName: 'Doe'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('should login with valid credentials', async () => {
        const email = `login-${Date.now()}@example.com`;
        const password = 'password123';

        // Register user first
        await request(app)
            .post('/api/users/register')
            .send({
                email,
                password,
                firstName: 'John',
                lastName: 'Doe'
            });

        // Login
        const res = await request(app)
            .post('/api/users/login')
            .send({ email, password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
        expect(res.body.data.user).toBeDefined();
    });

    test('should reject login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('should access protected route with valid token', async () => {
        const email = `protected-${Date.now()}@example.com`;
        
        // Register and get token
        const registerRes = await request(app)
            .post('/api/users/register')
            .send({
                email,
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        const token = registerRes.body.data.accessToken;

        // Access protected route
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(email);
    });

    test('should reject protected route without token', async () => {
        const res = await request(app).get('/api/users/me');

        expect(res.status).toBe(401);
    });

    test('should update user profile', async () => {
        const email = `update-${Date.now()}@example.com`;
        
        // Register and get token
        const registerRes = await request(app)
            .post('/api/users/register')
            .send({
                email,
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        const token = registerRes.body.data.accessToken;

        // Update profile
        const res = await request(app)
            .patch('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
                firstName: 'Jane',
                lastName: 'Smith'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.firstName).toBe('Jane');
        expect(res.body.data.lastName).toBe('Smith');
    });
});
