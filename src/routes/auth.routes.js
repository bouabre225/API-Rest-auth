const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');

const { registerSchema } = require('../schemas/register.schema');
const { loginSchema } = require('../schemas/login.schema');


router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
module.exports = router;
