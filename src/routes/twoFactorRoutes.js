const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/enable', authMiddleware, twoFactorController.enable);
router.post('/confirm', authMiddleware, twoFactorController.confirm);
router.post('/disable', authMiddleware, twoFactorController.disable);
router.post('/verify', authMiddleware, twoFactorController.verify);

module.exports = router;
