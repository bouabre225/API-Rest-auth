const express = require('express');
const router = express.Router();
const validate = require('../lib/validate');
const { registerSchema } = require('../schemas/user.schema');
const authController = require('../controllers/auth.controller');

router.post('/register', validate(registerSchema), authController.register);

module.exports = router;
router.post('/login', validate(loginSchema), authController.login);