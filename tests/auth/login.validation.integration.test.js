const request = require('supertest');
const app = require('../../src/app');
const { describe } = require('zod/v4/core');

describe('POST /auth/login (validation)', () => {
    test('refuse si email est manquante', async () => {
        const res = await request(app).post('/auth/login').send({
            password: 'Mot de passe',
        });

        expect(res.status).toBe(422);
    });

    test('refuse si password est manquante', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'richardanagonou0@gmailcom',
        });

        expect(res.status).toBe(422);
    });

    test('refuse si email est invalide', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'richardanagonou',
            password: 'Mot de passe',
        });

        expect(res.status).toBe(422);
    });

    test('refuse si les credentials sont invalides', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'invalide@gmailcom',
            password: 'Mot de passe invalide',
        });
        expect(res.status).toBe(401);
    });

});

    
