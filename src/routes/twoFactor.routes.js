import express from 'express';
const router = express.Router();
import {TwoFactorController} from '#controllers/twoFactorController';
import {authMiddleware} from '#middlewares/auth.middleware';

router.post('/enable', authMiddleware, TwoFactorController.enable);
router.post('/confirm', authMiddleware, TwoFactorController.confirm);
router.post('/disable', authMiddleware, TwoFactorController.disable);
router.post('/verify', authMiddleware, TwoFactorController.verify);

export default router;
