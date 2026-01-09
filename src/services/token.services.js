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
}