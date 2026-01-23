import jwt from 'jsonwebtoken';
import {OAuthService} from '../services/oauthService.js';
import {googleOAuthConfig} from '../config/oauth.config.js';
import {prisma} from '#lib/prisma';

const oauthService = new OAuthService();

class OAuthController {
  // Rediriger vers Google pour l'authentification
  googleAuth(req, res, next) {
    try {
      const authUrl = googleOAuthConfig.getAuthorizationUrl();
      res.redirect(authUrl);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la génération de l\'URL OAuth' });
    }
  }

  // Callback après authentification Google
  async googleCallback(req, res, next) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_code`);
      }

      // Échanger le code contre des tokens
      const tokens = await oauthService.exchangeCodeForTokens(code);
      
      // Récupérer les infos utilisateur
      const googleUser = await oauthService.getUserInfo(tokens.access_token);

      // Trouver ou créer l'utilisateur
      let user = await prisma.user.findUnique({ 
        where: { email: googleUser.email } 
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            emailVerified: true,
            emailVerifiedAt: new Date()
          }
        });
      }

      // Créer ou mettre à jour le compte OAuth
      let oauthAccount = await prisma.oAuthAccount.findFirst({
        where: {
          provider: 'google',
          providerAccountId: googleUser.id
        }
      });

      if (!oauthAccount) {
        oauthAccount = await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
          }
        });
      } else {
        await prisma.oAuthAccount.update({
          where: { id: oauthAccount.id },
          data: { 
            accessToken: tokens.access_token, 
            refreshToken: tokens.refresh_token 
          }
        });
      }

      // Générer les JWT tokens pour notre app
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }

  async unlinkProvider(req, res) {
    try {
      const userId = req.user.id;
      const { provider } = req.params;

      await oauthService.unlinkAccount(userId, provider);
      res.json({ message: `Compte ${provider} détaché avec succès` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLinkedAccounts(req, res) {
    try {
      const userId = req.user.id;
      const accounts = await oauthService.getLinkedAccounts(userId);
      res.json({ accounts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

const controller = new OAuthController();
export const googleAuth = controller.googleAuth.bind(controller);
export const googleCallback = controller.googleCallback.bind(controller);
export const unlinkProvider = controller.unlinkProvider.bind(controller);
export const getLinkedAccounts = controller.getLinkedAccounts.bind(controller);
