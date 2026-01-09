// src/middlewares/auth.middleware.js
import { verifyToken } from '#lib/jwt';
import { UnauthorizedException } from '#lib/exceptions';

/**
 * Middleware d'authentification JWT
 * Vérifie le token et attache l'utilisateur à la requête
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token d\'authentification manquant');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifie le token (pour l'instant, on simule)
    // const payload = await verifyToken(token);
    
    // Simulation pour le développement
    const payload = { userId: 'test-user-id' };
    
    // Attache l'utilisateur à la requête
    req.user = {
      id: payload.userId,
      email: 'test@example.com'
    };
    
    // Pour les besoins de Personne 3
    req.userId = payload.userId;
    
    next();
    
  } catch (error) {
    next(error);
  }
}