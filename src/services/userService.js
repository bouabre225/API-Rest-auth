const prisma = require('../config/database');
const bcrypt = require('bcrypt');

class UserService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerifiedAt: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return user;
  }

  async updateProfile(userId, data) {
    const { name, email } = data;

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email, emailVerified: false, emailVerifiedAt: null })
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        updatedAt: true
      }
    });
  }

  async deleteAccount(userId, password) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.password) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Mot de passe incorrect');
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        disabledAt: new Date()
      }
    });

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });

    return true;
  }

  async exportData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        refreshTokens: {
          select: {
            device: true,
            ipAddress: true,
            createdAt: true,
            expiresAt: true
          }
        },
        oauthAccounts: {
          select: {
            provider: true,
            createdAt: true
          }
        },
        loginHistory: {
          select: {
            ipAddress: true,
            userAgent: true,
            success: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        }
      }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    delete user.password;
    delete user.twoFactorSecret;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      sessions: user.refreshTokens,
      oauthAccounts: user.oauthAccounts,
      loginHistory: user.loginHistory,
      exportedAt: new Date().toISOString()
    };
  }
}

module.exports = new UserService();
