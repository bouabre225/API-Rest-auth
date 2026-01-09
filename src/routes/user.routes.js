import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { authMiddleware } from "#middlewares/auth.middleware";
import { authLimiter, registerLimiter } from "#middlewares/rate-limit.middleware";

const router = Router();

// Public routes with rate limiting
router.post('/register', registerLimiter, UserController.register);
router.post('/login', authLimiter, UserController.login);

// Email verification routes
router.get('/verify/:token', UserController.verifyEmail);

// Protected routes (require authentication)
router.get('/me', authMiddleware, UserController.getProfile);
router.patch('/me', authMiddleware, UserController.updateProfile);
router.post('/logout', authMiddleware, UserController.logout);
router.post('/verify-email', authMiddleware, UserController.sendVerificationEmail);

// Login history routes
router.get('/me/login-history', authMiddleware, UserController.getLoginHistory);
router.get('/me/failed-attempts', authMiddleware, UserController.getFailedAttempts);

export default router;
