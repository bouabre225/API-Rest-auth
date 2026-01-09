jest.mock('../../src/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const prisma = require('../../src/lib/prisma');
const bcrypt = require('bcrypt');
const { loginUser } = require('../../src/services/auth.service');
const { UnauthorizedException } = require('../../src/lib/exceptions');

describe('Auth Service - loginUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('jette une erreur si utilisateur inexistant', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: 'richard@test.com', password: 'password123' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('jette une erreur si mot de passe incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'richard@test.com',
      password: 'hashedPassword',
    });

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      loginUser({ email: 'richard@test.com', password: 'wrongPassword' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('retourne l’utilisateur sans le mot de passe si succès', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'richard@test.com',
      password: 'hashedPassword',
      firstName: 'Richard',
      lastName: 'Anagonou',
    });

    bcrypt.compare.mockResolvedValue(true);

    const user = await loginUser({
      email: 'richard@test.com',
      password: 'password123',
    });

    expect(user).toEqual({
      id: 1,
      email: 'richard@test.com',
      firstName: 'Richard',
      lastName: 'Anagonou',
    });

    expect(user.password).toBeUndefined();
  });
});
