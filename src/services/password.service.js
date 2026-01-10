import { prisma } from '#lib/prisma';
import { hash, compare } from 'bcrypt';

/**
 * Service de gestion avancée des mots de passe
 * Responsable: Richard
 * - Historique des passwords
 * - Politique d'expiration
 * - Blocage de compte
 */
export class PasswordService {
  // Vérifier si le mot de passe a été utilisé récemment
  static async isPasswordReused(userId, newPassword) {
    try {
      const history = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      for (const record of history) {
        const matches = await compare(newPassword, record.passwordHash);
        if (matches) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[PasswordService] Erreur vérification réutilisation:', error);
      return false;
    }
  }

  // Ajouter un mot de passe à l'historique
  static async addToHistory(userId, passwordHash) {
    try {
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash
        }
      });

      // Garder seulement les 3 derniers
      const allHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (allHistory.length > 3) {
        const toDelete = allHistory.slice(3);
        await prisma.passwordHistory.deleteMany({
          where: {
            id: { in: toDelete.map(h => h.id) }
          }
        });
      }

      return true;
    } catch (error) {
      console.error('[PasswordService] Erreur ajout historique:', error);
      return false;
    }
  }

  // Vérifier si le mot de passe est expiré (>90 jours)
  static async isPasswordExpired(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordChangedAt: true }
      });

      if (!user || !user.passwordChangedAt) {
        return false;
      }

      const now = new Date();
      const daysSinceChange = Math.floor((now - user.passwordChangedAt) / (1000 * 60 * 60 * 24));

      return daysSinceChange > 90;
    } catch (error) {
      console.error('[PasswordService] Erreur vérification expiration:', error);
      return false;
    }
  }

  // Enregistrer une tentative de connexion échouée
  static async recordFailedAttempt(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { failedLoginAttempts: true, lockedUntil: true }
      });

      if (!user) return { locked: false };

      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts: attempts };

      // Bloquer après 5 tentatives
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return {
        locked: attempts >= 5,
        attempts,
        lockedUntil: updateData.lockedUntil
      };
    } catch (error) {
      console.error('[PasswordService] Erreur enregistrement tentative:', error);
      return { locked: false };
    }
  }

  // Réinitialiser les tentatives après connexion réussie
  static async resetFailedAttempts(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      return true;
    } catch (error) {
      console.error('[PasswordService] Erreur réinitialisation tentatives:', error);
      return false;
    }
  }

  // Vérifier si un compte est bloqué
  static async isAccountLocked(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockedUntil: true }
      });

      if (!user || !user.lockedUntil) {
        return { locked: false };
      }

      const now = new Date();
      if (now < user.lockedUntil) {
        return {
          locked: true,
          lockedUntil: user.lockedUntil,
          minutesRemaining: Math.ceil((user.lockedUntil - now) / (1000 * 60))
        };
      }

      // Le blocage est expiré, on le reset
      await this.resetFailedAttempts(userId);
      return { locked: false };
    } catch (error) {
      console.error('[PasswordService] Erreur vérification blocage:', error);
      return { locked: false };
    }
  }

  // Calculer la force d'un mot de passe
  static calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];

    // Longueur
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    else feedback.push("Utilisez au moins 12 caractères");

    // Complexité
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push("Ajoutez des minuscules");

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push("Ajoutez des majuscules");

    if (/[0-9]/.test(password)) score += 15;
    else feedback.push("Ajoutez des chiffres");

    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    else feedback.push("Ajoutez des caractères spéciaux");

    // Niveau
    let level = 'Très faible';
    if (score >= 80) level = 'Fort';
    else if (score >= 60) level = 'Moyen';
    else if (score >= 40) level = 'Faible';

    return {
      score,
      level,
      feedback,
      isAcceptable: score >= 60
    };
  }
}
