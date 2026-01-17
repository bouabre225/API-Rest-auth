import express from 'express';
const router = express.Router();
import {UserController} from '#controllers/userController';
import {authMiddleware} from '#middlewares/auth.middleware';

const userController = new UserController();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.delete('/account', authMiddleware, userController.deleteAccount);
router.get('/export', authMiddleware, userController.exportData);

export default router;
