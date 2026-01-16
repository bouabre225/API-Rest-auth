const bcrypt = require('bcrypt');

describe('Password hashing (bcrypt)', () => {
  test('should hash password and validate it correctly', async () => {
    const plainPassword = 'MotDePasse@123';

    const hash = await bcrypt.hash(plainPassword, 10);

    expect(hash).not.toBe(plainPassword);

    const isValid = await bcrypt.compare(plainPassword, hash);
    expect(isValid).toBe(true);
  });

  test('should reject wrong password', async () => {
    const hash = await bcrypt.hash('MotDePasse@123', 10);

    const isValid = await bcrypt.compare('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});
