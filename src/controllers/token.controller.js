import { TokenService } from "#services/token.service";
import { signToken } from "#lib/jwt";
import { BadRequestException, UnauthorizedException } from "#lib/exceptions";

export class TokenController {
  //RAFRAÎCHIR UN ACCESS TOKEN
  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new BadRequestException("Refresh token requis");
      }
      
      //verifie le refresh token
      const verification = await TokenService.verifyToken(refreshToken);
      
      if (!verification.valid) {
        throw new UnauthorizedException(`Refresh token invalide: ${verification.reason}`);
      }
      
      
      const newAccessToken = await signToken(
        { userId: verification.user.id },
        "15m"  
      );
      
      
      res.json({
        success: true,
        accessToken: newAccessToken,
        expiresIn: 15 * 60,  
        user: {
          id: verification.user.id,
          email: verification.user.email
        }
      });
      
    } catch (error) {
            throw error;
    }
  }

  //SESSIONS ACTIVES
  static async getSessions(req, res) {
    try {
      // req.userId est defini par le middleware d'authentification
      const userId = req.userId;
      
      const sessions = await TokenService.getUserSessions(userId);
      
      res.json({
        success: true,
        sessions: sessions,
        count: sessions.length
      });
      
    } catch (error) {
      throw error;
    }
  }

  //DECONNECTER UNE SESSION
  static async revokeSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;
      
          const result = await TokenService.revokeToken(sessionId);
      
      if (!result.success) {
        throw new BadRequestException("Impossible de révoquer la session");
      }
      
      res.json({
        success: true,
        message: "Session déconnectée avec succès"
      });
      
    } catch (error) {
      throw error;
    }
  }

  //DeCONNECTER TOUTES LES AUTRES SESSIONS
  static async revokeOtherSessions(req, res) {
    try {
      const userId = req.userId;
      const currentToken = req.currentRefreshTokenId; // À définir dans le middleware
      
      const result = await TokenService.revokeAllUserTokens(userId, currentToken);
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      throw error;
    }
  }
}