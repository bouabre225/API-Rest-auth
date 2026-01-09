import { Router } from "express";
import { TokenService } from "#services/token.service";
import { asyncHandler } from "#lib/async-handler";
import { authenticate } from "#middlewares/auth.middleware";

const router = Router();

/**
 * @route   POST /auth/refresh
 * @desc    Rafraîchir un access token avec un refresh token
 * @access  Public
 */
router.post("/refresh", asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: "Refresh token requis"
    });
  }
  
  const verification = await TokenService.verifyToken(refreshToken);
  
  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      error: `Refresh token invalide: ${verification.reason}`
    });
  }
  
  // En production, on générerait un vrai JWT ici
  // Pour l'instant, on simule
  res.json({
    success: true,
    accessToken: "simulated_access_token_" + Date.now(),
    expiresIn: 900, // 15 minutes
    user: {
      id: verification.user.id,
      email: verification.user.email
    }
  });
}));

/**
 * @route   GET /auth/sessions
 * @desc    Lister toutes les sessions actives de l'utilisateur
 * @access  Private (authentifié)
 */
router.get("/sessions", authenticate, asyncHandler(async (req, res) => {
  const sessions = await TokenService.getUserSessions(req.user.id);
  
  res.json({
    success: true,
    count: sessions.length,
    sessions
  });
}));

/**
 * @route   DELETE /auth/sessions/:id
 * @desc    Révoquer une session spécifique
 * @access  Private (authentifié)
 */
router.delete("/sessions/:id", authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await TokenService.revokeToken(id);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: "Impossible de révoquer la session"
    });
  }
  
  res.json({
    success: true,
    message: "Session révoquée avec succès"
  });
}));

/**
 * @route   DELETE /auth/sessions/others
 * @desc    Révoquer toutes les autres sessions (garder la courante)
 * @access  Private (authentifié)
 */
router.delete("/sessions/others", authenticate, asyncHandler(async (req, res) => {
  const currentTokenId = req.currentRefreshTokenId; // À définir par le middleware
  
  const result = await TokenService.revokeAllUserTokens(req.user.id, currentTokenId);
  
  res.json({
    success: true,
    message: result.message,
    count: result.count
  });
}));

export default router;