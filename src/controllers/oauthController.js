const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const oauthService = require('../services/oauthService');

class OAuthController {
  googleAuth(req, res, next) {
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  }

  async googleCallback(req, res, next) {
    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      }

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
    })(req, res, next);
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

module.exports = new OAuthController();
