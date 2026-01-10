const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

class PasswordHistoryService {
  async addPasswordToHistory(userId, hashedPassword) {
    await prisma.passwordHistory.create({
      data: {
        userId,
        hashedPassword,
      },
    });

    await this.cleanOldPasswords(userId);
  }

  async cleanOldPasswords(userId, keepLast = 3) {
    const passwords = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: keepLast,
    });

    if (passwords.length > 0) {
      await prisma.passwordHistory.deleteMany({
        where: {
          id: { in: passwords.map((p) => p.id) },
        },
      });
    }
  }

  async isPasswordReused(userId, newPassword) {
    const history = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    for (const entry of history) {
      const isMatch = await bcrypt.compare(newPassword, entry.hashedPassword);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  async getPasswordHistory(userId) {
    return await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
      },
    });
  }
}

module.exports = new PasswordHistoryService();
