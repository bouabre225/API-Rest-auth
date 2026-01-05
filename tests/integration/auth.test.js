import './env.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { setupDatabase } from './setup.js';
import app from '../../src/app.js';
import { prisma } from '#lib/prisma';

describe('Authentication Flow', () => {
    before(async () => {
        setupDatabase();
        process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
    });

    after(async () => {
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

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.accessToken);
        assert.ok(res.body.data.refreshToken);
        assert.ok(res.body.data.user);
        assert.strictEqual(res.body.data.user.firstName, 'John');
        assert.strictEqual(res.body.data.user.password, undefined);
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

        assert.strictEqual(res.status, 409);
        assert.strictEqual(res.body.success, false);
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

        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.body.success, false);
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

        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.body.success, false);
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

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.accessToken);
        assert.ok(res.body.data.refreshToken);
        assert.ok(res.body.data.user);
    });

    test('should reject login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.body.success, false);
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

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.email, email);
    });

    test('should reject protected route without token', async () => {
        const res = await request(app).get('/api/users/me');

        assert.strictEqual(res.status, 401);
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

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.firstName, 'Jane');
        assert.strictEqual(res.body.data.lastName, 'Smith');
    });
});
