import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { authMiddleware } from "#middlewares/auth.middleware";

const router = Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes (require authentication)
router.get('/me', authMiddleware, UserController.getProfile);
router.patch('/me', authMiddleware, UserController.updateProfile);
router.post('/logout', authMiddleware, UserController.logout);

export default router;
