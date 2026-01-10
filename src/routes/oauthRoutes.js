const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/google', oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);
router.delete('/unlink/:provider', authMiddleware, oauthController.unlinkProvider);
router.get('/linked', authMiddleware, oauthController.getLinkedAccounts);

module.exports = router;
