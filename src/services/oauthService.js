const prisma = require('../config/database');

class OAuthService {
  async linkAccount(userId, provider, providerAccountId, accessToken, refreshToken) {
    const existingAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId,
        provider
      }
    });

    if (existingAccount) {
      throw new Error(`Compte ${provider} déjà lié`);
    }

    return await prisma.oAuthAccount.create({
      data: {
        userId,
        provider,
        providerAccountId,
        accessToken,
        refreshToken
      }
    });
  }

  async unlinkAccount(userId, provider) {
    const account = await prisma.oAuthAccount.findFirst({
      where: {
        userId,
        provider
      }
    });

    if (!account) {
      throw new Error('Compte OAuth non trouvé');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.password) {
      const otherAccounts = await prisma.oAuthAccount.count({
        where: {
          userId,
          provider: { not: provider }
        }
      });

      if (otherAccounts === 0) {
        throw new Error('Impossible de détacher le dernier moyen de connexion. Définissez un mot de passe d\'abord.');
      }
    }

    await prisma.oAuthAccount.delete({ where: { id: account.id } });
    return true;
  }

  async getLinkedAccounts(userId) {
    return await prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        createdAt: true
      }
    });
  }
}

module.exports = new OAuthService();
