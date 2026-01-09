const authService = require('../services/auth.service');

const register = async (req, res, next) => {
    try {
        const user = await authService.registerUser(req.validatedBody);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
};
const login = async (req, res, next) => {
  try {
    // 👉 ON UTILISE validatedBody
    const result = await authService.login(req.validatedBody);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
    register,
    login
};