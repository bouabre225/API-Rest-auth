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
        
        // Extract metadata for login history
        const metadata = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        };
        
        const result = await UserService.login(validatedData, metadata);

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
        const accessToken = req.token; // From auth middleware
        
        await UserService.logout(refreshToken, accessToken);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    });

    /**
     * Get login history
     * GET /api/users/me/login-history
     */
    static getLoginHistory = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        const history = await UserService.getLoginHistory(req.user.id, limit);

        res.status(200).json({
            success: true,
            data: history
        });
    });

    /**
     * Get failed login attempts
     * GET /api/users/me/failed-attempts
     */
    static getFailedAttempts = asyncHandler(async (req, res) => {
        const timeWindow = parseInt(req.query.timeWindow) || 15;
        const count = await UserService.getFailedLoginAttempts(req.user.id, timeWindow);

        res.status(200).json({
            success: true,
            data: {
                count,
                timeWindowMinutes: timeWindow
            }
        });
    });

    /**
     * Send verification email
     * POST /api/users/verify-email
     */
    static sendVerificationEmail = asyncHandler(async (req, res) => {
        const { VerificationService } = await import('#services/verification.service');
        const token = await VerificationService.generateVerificationToken(req.user.id);
        
        // TODO: Send email with token (when mailer is integrated)
        // For now, just return the token for testing
        
        res.status(200).json({
            success: true,
            message: 'Verification email sent',
            data: { token } // Remove in production
        });
    });
    
    /**
     * Verify email with token
     * GET /api/users/verify/:token
     */
    static verifyEmail = asyncHandler(async (req, res) => {
        const { VerificationService } = await import('#services/verification.service');
        await VerificationService.verifyEmail(req.params.token);
        
        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    });
}
