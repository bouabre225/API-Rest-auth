import './env.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import express from "express";
import request from 'supertest';
import { authMiddleware } from "#middlewares/auth.middleware";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

describe('Auth Middleware', () => {
    let app;

    before(async () => {
        process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
        app = express();
        app.get('/protected', authMiddleware, (req, res) => {
            res.status(200).send('ok');
        });

        app.get('/me', authMiddleware, (req, res) => {
            res.status(200).json(req.user);
        });
    });

    after(async () => {
        await prisma.$disconnect();
    });

    test('should reject request without token', async () => {
        const res = await request(app).get('/protected');
        assert.strictEqual(res.status, 401);
    });

    test('should reject request with invalid token', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalidtoken');

        assert.strictEqual(res.status, 401);
    });

    test('should reject malformed authorization header', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'InvalidFormat');
        assert.strictEqual(res.status, 401);
    });

    test('should accept request with valid token', async () => {
        const token = jwt.sign(
            { userId: 1, email: 'florent@test.co' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(res.status, 200);
    });

    test('should attach decoded user to req.user', async () => {
        const payload = { userId: 1, email: 'florent@test.co' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app)
            .get('/me')
            .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.userId, 1);
        assert.strictEqual(res.body.password, undefined);
    });

    test('should reject token if user not exist in db', async () => {
        const user = await prisma.user.create({
            data: {
                email: 'deleted@test.co',
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

        assert.strictEqual(res.status, 401);
    });
});