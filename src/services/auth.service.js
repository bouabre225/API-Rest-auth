import { prisma } from "#lib/prisma"
import { mailer } from "#lib/mailer"
import { signToken, verifyToken} from "#lib/jwt"
import { hashPassword } from "#lib/password"
import { ConflictException, UnauthorizedException, BadRequestException } from "#lib/exceptions"
import crypto from "crypto"

// Ajoute des jours à une date
function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export class AuthService {
    // Vérifie l'email d'un utilisateur à partir d'un token
    static async verifyEmail(token) {
    if (!token || typeof token !== "string") {
      throw new BadRequestException("Missing token")
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!record) throw new BadRequestException("Invalid token");
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("Token expired")
    }

    let user;
    await prisma.$transaction(async (tx) => {
      user = await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      })

      await tx.verificationToken.delete({ where: { token } });
    })

    // Generate access token
    const accessToken = await signToken({
        userId: user.id,
        email: user.email
    }, '1h');

    // Generate refresh token
    const refreshToken = await signToken({
        userId: user.id,
        email: user.email
    }, '7d');

    // Store refresh token
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    return {
        accessToken,
        refreshToken
    };
  }

  // Rafraîchit un token d'accès à partir d'un token de rafraîchissement avec rotation
  static async refresh(refreshToken, deviceInfo = {}) {
    if (!refreshToken) throw new BadRequestException("Missing refreshToken")

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    })

    if (!stored) throw new UnauthorizedException("Invalid refresh token")
    if (stored.revokedAt) {
      // Détection de réutilisation - révoquer tous les tokens de l'utilisateur
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
      throw new UnauthorizedException("Token reuse detected - all sessions revoked")
    }
    if (stored.expiresAt < new Date()) throw new UnauthorizedException("Refresh token expired")

    // Rotation du token: révoquer l'ancien et créer un nouveau
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    })

    // Créer un nouveau refresh token
    const newRefreshTokenValue = crypto.randomBytes(40).toString('hex')
    const newExpiresAt = addDays(new Date(), 7)
    
    const newRefreshToken = await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenValue,
        userId: stored.userId,
        userAgent: deviceInfo.userAgent || stored.userAgent,
        ipAddress: deviceInfo.ipAddress || stored.ipAddress,
        expiresAt: newExpiresAt
      }
    })

    const accessToken = await signToken({ userId: stored.userId })
    
    return { 
      accessToken,
      refreshToken: newRefreshToken.token
    }
  }

  // Envoie un email de réinitialisation de mot de passe
  static async forgotPassword(email) {
    if (!email) throw new BadRequestException("Email is required");

    // Vérifie si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Ne pas révéler que l'email n'existe pas
      return;
    }

    // Crée un token unique pour le reset
    const token = crypto.randomUUID();
    const expiresAt = addDays(new Date(), 1); // valable 24h

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const front = process.env.FRONT_URL || "http://localhost:5173";
    const resetUrl = `${front}/reset-password?token=${token}`;

    if (process.env.MAIL_HOST) {
      await mailer.sendResetPassword(user.email, token);
    } else {
      // En dev, on log le lien
      console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    }
  }

    // Réinitialise le mot de passe avec le token et le nouveau mot de passe
  static async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new BadRequestException("Token and new password are required");
    }

    // Cherche le token et vérifie expiration
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) throw new BadRequestException("Invalid token");
    if (record.expiresAt < new Date()) throw new BadRequestException("Token expired");

    // Hash le nouveau mot de passe
    const hashed = await hashPassword(newPassword);

    // Update user et supprime le token
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      });

      await tx.passwordResetToken.delete({ where: { token } });
    });
  }

}
