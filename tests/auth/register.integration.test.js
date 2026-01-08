const request = require('supertest');
const express = require('express');
const prisma = require('../../src/lib/prisma');
const authService = require('../../src/services/auth.service');
const validate = require('../../src/lib/validate');
const { registerSchema } = require('../../src/schemas/user.schema');

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
}));


// Mock de Prisma
jest.mock('../../src/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

describe('POST /auth/register (integration)', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.post(
            '/auth/register',
            validate(registerSchema),
            async (req, res, next) => {
                try {
                    const user = await authService.registerUser(req.validatedBody);
                    res.status(201).json(user);
                } catch (error) {
                    next(error);
                }
            }
        );
    });

    test('enregistre un nouvel utilisateur avec succès', async () => {
        // Mock: Aucun utilisateur existant
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
            id: '1',
            email: 'richardanagonou0@gmail.com',
            firstName: 'Richard',
            lastName: 'ANAGONOU',
            password: 'hashedpassword',
        });

        const res = await request(app).post('/auth/register').send({
            email: 'richardanagonou0@gmail.com',
            password: 'Password',
            firstName: 'Richard',
            lastName: 'ANAGONOU',
        });

        expect(res.status).toBe(201);
        expect(res.body.email).toBe('richardanagonou0@gmail.com');
        expect(res.body.password).toBeUndefined();
    });
});    