import { UserService } from "#services/user.service";
import { asyncHandler } from "#lib/async-handler";
import { validateData } from "#lib/validate";
import { registerSchema, loginSchema, updateUserSchema } from "#schemas/user.schema";

export class UserController {
    /**
     * Register a new user
     * POST /api/users/register
     */
    static register = asyncHandler(async (req, res) => {
        const validatedData = validateData(registerSchema, req.body);
        const result = await UserService.register(validatedData);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    });

    /**
     * Login user
     * POST /api/users/login
     */
    static login = asyncHandler(async (req, res) => {
        const validatedData = validateData(loginSchema, req.body);
        const result = await UserService.login(validatedData);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    });

    /**
     * Get current user profile
     * GET /api/users/me
     */
    static getProfile = asyncHandler(async (req, res) => {
        const user = await UserService.getUserById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    });

    /**
     * Update user profile
     * PATCH /api/users/me
     */
    static updateProfile = asyncHandler(async (req, res) => {
        const validatedData = validateData(updateUserSchema, req.body);
        const user = await UserService.updateUser(req.user.id, validatedData);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    });

    /**
     * Logout user
     * POST /api/users/logout
     */
    static logout = asyncHandler(async (req, res) => {
        const refreshToken = req.body.refreshToken;
        
        if (refreshToken) {
            await UserService.logout(refreshToken);
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    });
}
