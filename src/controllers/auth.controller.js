import { AuthService } from "#services/auth.service"


export class AuthController {
    // Vérifie l'email d'un utilisateur à partir d'un token
    static async  verifyEmailController(req, res) {
      const {token} = req.query

      // Appelle le service pour vérifier l'email
      await AuthService.verifyEmail(token)
      res.json({
        success: true,
        message: "Email verified successfully",
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

    // Récupère le token et le nouveau mot de passe depuis le corps de la requête
    const { token, password } = req.body

    // Appelle le service pour réinitialiser le mot de passe
    await AuthService.resetPassword(token, password)
    res.json({ 
      success: true,
      message: "Password reset successful",
    })
  }

  // Rafraîchit un token d'accès à partir d'un token de rafraîchissement
  static async refresh(req, res) {

    // Valide les données d'entrée
    const { refreshToken } = validateData(refreshSchema, req.body)
    const tokens = await AuthService.refresh(
      refreshToken
    )

    res.status(200).json(tokens);
  }
}