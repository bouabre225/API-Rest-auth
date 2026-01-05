import { describe, test, before, after } from 'node:test';
import assert from 'node:assert';
import { setupDatabase } from './setup.js';
import { prisma } from '#lib/prisma';
import jwt from 'jsonwebtoken';

describe('User model', () => {
  before(async () => {
    setupDatabase();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test('should create and retrieve user', async () => {
    const email = `test-${Date.now()}@example.com`;

    const user = await prisma.user.create({
      data: { 
        email, 
        password: 'hashed', 
        firstName: 'Test', 
        lastName: 'User',
      },
    });

    assert.ok(user.id);

    const found = await prisma.user.findUnique({
      where: { email },
    });

    assert.ok(found);
    assert.strictEqual(found.firstName, 'Test');
  });

  test('should generate jwt', async () => {
    const user = await prisma.user.create({ 
      data: { 
        email: `jwt-${Date.now()}@example.com`, 
        password: 'hashed', 
        firstName: 'JWT', 
        lastName: 'User' 
      }
    });
    
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      'Secret-cle-avec-plus-de-mot', 
      { expiresIn: '1h' }
    );
    
    assert.ok(token);

    // Verify if jwt correctly generated
    const decode = jwt.verify(token, 'Secret-cle-avec-plus-de-mot');
    assert.strictEqual(decode.userId, user.id);
  });
});