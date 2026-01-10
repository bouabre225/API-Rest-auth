const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../config/database');
const bcrypt = require('bcrypt');

class TwoFactorService {
  async enable2FA(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA déjà activé');
    }

    const secret = speakeasy.generateSecret({
      name: `API-Auth (${user.email})`,
      length: 32
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 }
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push(code);
      const hashedCode = await bcrypt.hash(code, 10);
      await prisma.backupCode.create({
        data: {
          userId,
          code: hashedCode
        }
      });
    }

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    };
  }

  async verify2FACode(userId, token) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA non configuré');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    return verified;
  }

  async confirm2FA(userId, token) {
    const verified = await this.verify2FACode(userId, token);
    if (!verified) {
      throw new Error('Code invalide');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return true;
  }

  async disable2FA(userId, password, token) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA non activé');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Mot de passe incorrect');
    }

    const verified = await this.verify2FACode(userId, token);
    if (!verified) {
      throw new Error('Code 2FA invalide');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    await prisma.backupCode.deleteMany({ where: { userId } });

    return true;
  }

  async verifyBackupCode(userId, code) {
    const backupCodes = await prisma.backupCode.findMany({
      where: { userId, used: false }
    });

    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code);
      if (isValid) {
        await prisma.backupCode.update({
          where: { id: backupCode.id },
          data: { used: true, usedAt: new Date() }
        });
        return true;
      }
    }

    return false;
  }
}

module.exports = new TwoFactorService();
