import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { setupDatabase } from './setup.js';
import { prisma } from '#lib/prisma';
import jwt from 'jsonwebtoken';

describe('User model', () => {
  beforeAll(async () => {
    setupDatabase();
  });

  afterAll(async () => {
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

    expect(user.id).toBeDefined();

    const found = await prisma.user.findUnique({
      where: { email },
    });

    expect(found).toBeDefined();
    expect(found.firstName).toBe('Test');
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
    
    expect(token).toBeDefined();

    // Verify if jwt correctly generated
    const decode = jwt.verify(token, 'Secret-cle-avec-plus-de-mot');
    expect(decode.userId).toBe(user.id);
  });
});