const authService = require('../src/services/auth.service');

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