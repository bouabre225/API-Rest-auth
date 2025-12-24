import './env.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { setupDatabase } from './setup.js';
import jwt from 'jsonwebtoken';
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

before(async () => {
  setupDatabase();
});

after(async () => {
  await prisma.$disconnect();
});

describe('User model', () => {

  test('should create and retrieve user', async () => {
    const email = `test-${Date.now()}@example.com`;

    const user = await prisma.user.create({
      data: { email, password: 'hashed', firstName: 'Test', lastName: 'User',
      },
    });

    assert.ok(user.id);

    const found = await prisma.user.findUnique({
      where: { email },
    });

    assert.ok(found);
    assert.strictEqual(found.firstName, 'Test');
  });

  test('should generate jwt', async ()=>{
    const user = await prisma.user.create({ data: { email: `jwt-${Date.now()}@example.com`, password: 'hashed', firstName: 'JWT', lastName: 'User' }})
    const token = jwt.sign({userId: user.id, email: user.email}, 'Secret-cle-avec-plus-de-mot', {expiresIn: '1h'})
    assert.ok(token, 'token must be generated')
  });

});
