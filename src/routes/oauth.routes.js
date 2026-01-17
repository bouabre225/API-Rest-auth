import express from 'express';
const router = express.Router();
import {OAuthController} from '#controllers/oauthController';
import {authMiddleware} from '#middlewares/auth.middleware';

const oauthController = new OAuthController();

router.get('/google', oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);
router.delete('/unlink/:provider', authMiddleware, oauthController.unlinkProvider);
router.get('/linked', authMiddleware, oauthController.getLinkedAccounts);

export default router;
