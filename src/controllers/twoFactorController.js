import {TwoFactorService} from '#services/twoFactorService';

export class TwoFactorController {
  async enable(req, res) {
    try {
      const userId = req.user.id;
      const result = await TwoFactorService.enable2FA(userId);
      
      res.json({
        message: '2FA initialisé. Scannez le QR code et confirmez avec un code.',
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async confirm(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Code requis' });
      }

      await TwoFactorService.confirm2FA(userId, token);
      
      res.json({ message: '2FA activé avec succès' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async disable(req, res) {
    try {
      const userId = req.user.id;
      const { password, token } = req.body;

      if (!password || !token) {
        return res.status(400).json({ error: 'Mot de passe et code requis' });
      }

      await TwoFactorService.disable2FA(userId, password, token);
      
      res.json({ message: '2FA désactivé avec succès' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async verify(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Code requis' });
      }

      const verified = await TwoFactorService.verify2FACode(userId, token);
      
      if (!verified) {
        return res.status(400).json({ error: 'Code invalide' });
      }

      res.json({ message: 'Code valide' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

