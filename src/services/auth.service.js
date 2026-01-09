import prisma from "#lib/prisma"
import { mailer } from "#lib/mailer"
import { ConflictException, UnauthorizedException, BadRequestException } from "#lib/exceptions"

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

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      })

      await tx.verificationToken.delete({ where: { token } });
    })
  }

  // Rafraîchit un token d'accès à partir d'un token de rafraîchissement
  static async refresh(refreshToken) {
    if (!refreshToken) throw new BadRequestException("Missing refreshToken")

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!stored) throw new UnauthorizedException("Invalid refresh token")
    if (stored.revokedAt) throw new UnauthorizedException("Refresh token revoked")
    if (stored.expiresAt < new Date()) throw new UnauthorizedException("Refresh token expired")

    // Optionnel : vérifier signature JWT aussi
    await verifyToken(refreshToken).catch(() => {
      throw new UnauthorizedException("Invalid refresh token")
    })

    const accessToken = await signAccessToken({ userId: stored.userId })
    return { accessToken }
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
