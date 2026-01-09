import prisma from "#lib/prisma";
import { randomBytes } from "crypto";

export class TokenService {
  
  static generateToken() {
    return randomBytes(40).toString("hex");
  }

  static async createRefreshToken(userId, deviceInfo = {}) {
    try {
      
      const token = this.generateToken();
      
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: token,
          userId: userId,
          device: deviceInfo.device || "Appareil inconnu",
          userAgent: deviceInfo.userAgent || null,
          ipAddress: deviceInfo.ipAddress || null,
          expiresAt: expiresAt,
          revoked: false
        }
      });
      
      return refreshToken;
      
    } catch (error) {
      console.error("Erreur création refresh token:", error);
      throw error;
    }
  }

  
  static async findByToken(token) {
    try {
      const found = await prisma.refreshToken.findUnique({
        where: { token: token },
        include: { user: true }  
      });
      
      return found;
      
    } catch (error) {
      console.error("Erreur recherche token:", error);
      return null;
    }
  }

  
  static async verifyToken(token) {
    //trouve le token
    const refreshToken = await this.findByToken(token);
    
    if (!refreshToken) {
      return { valid: false, reason: "Token non trouvé" };
    }
    
    
    if (refreshToken.revoked) {
      return { valid: false, reason: "Token révoqué" };
    }
    
    
    if (new Date() > refreshToken.expiresAt) {
      return { valid: false, reason: "Token expiré" };
    }
    
    
    return { 
      valid: true, 
      refreshToken: refreshToken,
      user: refreshToken.user
    };
  }


// OBTENIR TOUTES LES SESSIONS D'UN UTILISATEUR
static async getUserSessions(userId) {
  try {
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId: userId,
        revoked: false,
        expiresAt: { gt: new Date() }  //pas expire
      },
      orderBy: { createdAt: "desc" }
    });
    
    //formatage pour affichage
    return sessions.map(session => ({
      id: session.id,
      token: session.token.substring(0, 10) + "...", //pas tout le token 
      device: session.device,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: false //on verra plus tard
    }));
    
  } catch (error) {
    console.error("Erreur récupération sessions:", error);
    return [];
  }
}

//revoquation (deconnection dun appareil)
static async revokeToken(tokenId) {
  try {
    const updated = await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true }
    });
    
    return { success: true, token: updated };
    
  } catch (error) {
    console.error("Erreur révocation token:", error);
    return { success: false, error: error.message };
  }
}

//revoquer tous les tokens dun user sauf un
static async revokeAllUserTokens(userId, exceptTokenId = null) {
  try {
    const whereClause = { userId: userId };
    
    //si on veut en exclure un (ex: garder la session actuelle)
    if (exceptTokenId) {
      whereClause.id = { not: exceptTokenId };
    }
    
    const result = await prisma.refreshToken.updateMany({
      where: whereClause,
      data: { revoked: true }
    });
    
    return { 
      success: true, 
      count: result.count,
      message: `${result.count} tokens révoqués`
    };
    
  } catch (error) {
    console.error("Erreur révocation multiple:", error);
    return { success: false, error: error.message };
  }
}

}

