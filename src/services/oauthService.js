import {prisma} from '#lib/prisma';
import axios from 'axios';
import {googleOAuthConfig} from '../config/oauth.config.js';

export class OAuthService {
  // Échanger le code d'autorisation contre des tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post(googleOAuthConfig.tokenUrl, {
        code,
        client_id: googleOAuthConfig.clientId,
        client_secret: googleOAuthConfig.clientSecret,
        redirect_uri: googleOAuthConfig.redirectUri,
        grant_type: 'authorization_code'
      });

      return response.data;
    } catch (error) {
      throw new Error('Échec de l\'échange du code OAuth: ' + error.message);
    }
  }

  // Récupérer les informations utilisateur depuis Google
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(googleOAuthConfig.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error('Échec de récupération des infos utilisateur: ' + error.message);
    }
  }

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
