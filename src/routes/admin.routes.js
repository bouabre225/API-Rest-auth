import { Router } from "express";
import { AdminController } from "#controllers/admin.controller";
import { authMiddleware } from "#middlewares/auth.middleware";

const router = Router();

// All admin routes require authentication
// TODO: Add admin role check middleware

router.get('/blacklist/stats', authMiddleware, AdminController.getBlacklistStats);
router.post('/cleanup', authMiddleware, AdminController.runCleanup);
router.post('/users/:userId/revoke-tokens', authMiddleware, AdminController.revokeUserTokens);

export default router;
