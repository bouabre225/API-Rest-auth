const userService = require('../services/userService');

class UserController {
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await userService.getProfile(userId);
      res.json(profile);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      const updatedProfile = await userService.updateProfile(userId, { name, email });
      res.json({
        message: 'Profil mis à jour avec succès',
        user: updatedProfile
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Mot de passe requis' });
      }

      await userService.deleteAccount(userId, password);
      res.json({ message: 'Compte désactivé avec succès' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async exportData(req, res) {
    try {
      const userId = req.user.id;
      const data = await userService.exportData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
