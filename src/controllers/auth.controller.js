import { AuthService } from "#services/auth.service"
import { VerificationService } from "#services/verification.service"


export class AuthController {
    // Vérifie l'email d'un utilisateur à partir d'un token (query param)
    static async verifyEmailController(req, res) {
      const {token} = req.query

      const tokens = await AuthService.verifyEmail(token)
      res.json({
        success: true,
        message: "Email verified successfully",
        data: tokens
      })
    }

    // Vérifie l'email d'un utilisateur à partir d'un token (URL param)
    static async verifyEmailByToken(req, res) {
      const {token} = req.params

      const tokens = await AuthService.verifyEmail(token)
      res.json({
        success: true,
        message: "Email verified successfully",
        data: tokens
      })
    }

    // Renvoie un email de vérification
    static async resendVerification(req, res) {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email is required"
        })
      }

      // Générer un nouveau token et envoyer l'email
      await VerificationService.sendVerificationEmail(email)
      
      res.json({
        success: true,
        message: "Verification email sent"
      })
    }

    // Envoie un email de réinitialisation de mot de passe
    static async forgotPassword(req, res) {
      const { email } = req.body
      await AuthService.forgotPassword(email)
      res.json({ 
        success: true,
        message: "If the email exists, a reset link has been sent"
      })
    }

  // Réinitialise le mot de passe à partir d'un token
  static async resetPassword(req, res) {
    const { token, password } = req.body

    await AuthService.resetPassword(token, password)
    res.json({ 
      success: true,
      message: "Password reset successful",
    })
  }

  // Rafraîchit un token d'accès à partir d'un token de rafraîchissement
  static async refresh(req, res) {
    const { refreshToken } = req.body
    const deviceInfo = {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    }
    const tokens = await AuthService.refresh(refreshToken, deviceInfo)

    res.status(200).json(tokens);
  }
}