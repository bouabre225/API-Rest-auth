import express from 'express';
const router = express.Router();
import {TwoFactorController} from '#controllers/twoFactorController';
import {authMiddleware} from '#middlewares/auth.middleware';
import {asyncHandler} from '#lib/async-handler';

router.post('/enable', authMiddleware, asyncHandler(TwoFactorController.enable));
router.post('/confirm', authMiddleware, asyncHandler(TwoFactorController.confirm));
router.post('/disable', authMiddleware, asyncHandler(TwoFactorController.disable));
router.post('/verify', authMiddleware, asyncHandler(TwoFactorController.verify));

export default router;
