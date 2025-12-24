import './env.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { setupDatabase } from './setup.js';
import jwt from 'jsonwebtoken';
import express from "express";
import request from 'supertest'
import {authMiddleware} from "#middlewares/auth.middleware";
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });



describe('Auth Middleware', ()=>{
    let app;
    before(()=>{
        app = express ();
        app.get('/protected', authMiddleware, (req, res)=>{
            res.status(200).send('ok')
        });
    });
    
    test('should reject request without token', async ()=>{
        const res = await request(app).get('/protected');
        assert.strictEqual(res.status, 401);
    })

    test('should reject request with invalid token', async ()=>{
        const res = await request(app).get('/protected').set('Authorization', 'Bear invalid token')

        assert.strictEqual(res.status, 401);
    });

    test('should reject malformed authorization header', async ()=>{
        const res = await request(app).get('/protected').set('Authorization', 'InvalidFormat');
    });
});