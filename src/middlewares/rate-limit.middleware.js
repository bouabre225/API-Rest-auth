import rateLimit from 'express-rate-limit';
import { logger } from '#lib/logger';

/**
 * Rate limiter général pour toutes les routes
 * 100 requêtes par 15 minutes par IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par fenêtre
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
});

/**
 * Rate limiter strict pour les routes d'authentification
 * 5 tentatives par 15 minutes par IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives par fenêtre
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Ne compte que les échecs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ 
      ip: req.ip, 
      path: req.path,
      email: req.body?.email 
    }, 'Authentication rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});

/**
 * Rate limiter pour l'inscription
 * 3 inscriptions par heure par IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Limite de 3 inscriptions par heure
  message: {
    success: false,
    error: 'Too many accounts created from this IP, please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ 
      ip: req.ip,
      email: req.body?.email 
    }, 'Registration rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many accounts created. Please try again after an hour.'
    });
  }
});

/**
 * Rate limiter pour les actions sensibles
 * 10 requêtes par 10 minutes par IP
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many requests for this action, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ 
      ip: req.ip, 
      path: req.path,
      userId: req.user?.id 
    }, 'Sensitive action rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many requests for this action. Please slow down.'
    });
  }
});
