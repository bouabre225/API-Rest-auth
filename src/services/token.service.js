import { randomBytes } from 'crypto';
import { prisma } from '#lib/prisma';

export class TokenService {
  // 1. Générer un token cryptographique unique
  static generateToken() {
    return randomBytes(40).toString('hex');
  }
  
  // 2. Créer un refresh token (whitelist)
  static async createRefreshToken(userId, deviceInfo = {}) {
    try {
      // Vérification de l'utilisateur
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!userExists) {
        throw new Error(`Utilisateur ${userId} non trouvé`);
      }
      
      // Génération et création
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
      
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token,
          userId,
          userAgent: deviceInfo.userAgent || null,
          ipAddress: deviceInfo.ipAddress || null,
          expiresAt,
          revokedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      return refreshToken;
      
    } catch (error) {
      console.error('[TokenService] Erreur création refresh token:', error);
      throw error;
    }
  }
  
  // 3 Vérifier un refresh token (whitelist validation)
  static async verifyToken(token) {
    try {
      if (!token) {
        return { valid: false, reason: 'Token manquant' };
      }
      
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      // Validation whitelist
      if (!refreshToken) {
        return { valid: false, reason: 'Token non trouvé dans la whitelist' };
      }
      
      if (refreshToken.revokedAt) {
        return { valid: false, reason: 'Token révoqué' };
      }
      
      if (new Date() > refreshToken.expiresAt) {
        return { valid: false, reason: 'Token expiré' };
      }
      
      return {
        valid: true,
        refreshToken,
        user: refreshToken.user
      };
      
    } catch (error) {
      console.error('[TokenService] Erreur vérification token:', error);
      return { valid: false, reason: 'Erreur de vérification' };
    }
  }
  
  // 4 Lister les sessions actives (non révoquées, non expirées)
  static async getUserSessions(userId) {
    try {
      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          token: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true
        }
      });
      
      return sessions.map(session => ({
        id: session.id,
        tokenPreview: `${session.token.substring(0, 10)}...`,
        device: this._extractDeviceFromUserAgent(session.userAgent),
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: !session.revokedAt && new Date() < session.expiresAt
      }));
      
    } catch (error) {
      console.error('[TokenService] Erreur récupération sessions:', error);
      return [];
    }
  }
  
  // 5 Révoquer une session spécifique
  static async revokeToken(tokenId) {
    try {
      const updated = await prisma.refreshToken.update({
        where: { id: tokenId },
        data: { revokedAt: new Date() }
      });
      
      return { success: true, token: updated };
      
    } catch (error) {
      console.error('[TokenService] Erreur révocation token:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 6Révoquer toutes les sessions sauf une (optionnel)
  static async revokeAllUserTokens(userId, exceptTokenId = null) {
    try {
      const where = { userId, revokedAt: null };
      
      if (exceptTokenId) {
        where.id = { not: exceptTokenId };
      }
      
      const result = await prisma.refreshToken.updateMany({
        where,
        data: { revokedAt: new Date() }
      });
      
      return {
        success: true,
        count: result.count,
        message: `${result.count} sessions révoquées`
      };
      
    } catch (error) {
      console.error('[TokenService] Erreur révocation multiple:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 7 Helper interne
  static _extractDeviceFromUserAgent(userAgent) {
    if (!userAgent) return 'Inconnu';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Navigateur';
  }
}