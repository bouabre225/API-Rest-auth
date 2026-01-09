import { prisma } from "#lib/prisma";
import { hashPassword, verifyPassword } from "#lib/password";
import { signToken } from "#lib/jwt";
import { UserDto } from "#dto/user.dto";
import { ConflictException, UnauthorizedException, NotFoundException } from "#lib/exceptions";

export class UserService {
    /**
     * Register a new user
     */
    static async register({ email, password, firstName, lastName }) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName
            }
        });

        // Generate access token
        const accessToken = await signToken({
            userId: user.id,
            email: user.email
        }, '1h');

        // Generate refresh token
        const refreshToken = await signToken({
            userId: user.id,
            email: user.email
        }, '7d');

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        return {
            user: new UserDto(user),
            accessToken,
            refreshToken
        };
    }

    /**
     * Login user
     */
    static async login({ email, password }, metadata = {}) {
        const { ipAddress, userAgent } = metadata;
        
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // If user not found, can't log in LoginHistory (foreign key constraint)
        // Just throw error directly
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await verifyPassword(user.password, password);

        // Log failed attempt if password incorrect
        if (!isPasswordValid) {
            await prisma.loginHistory.create({
                data: {
                    userId: user.id,
                    ipAddress,
                    userAgent,
                    success: false
                }
            }).catch(() => {}); // Ignore errors in logging
            
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is disabled
        if (user.disabledAt) {
            await prisma.loginHistory.create({
                data: {
                    userId: user.id,
                    ipAddress,
                    userAgent,
                    success: false
                }
            }).catch(() => {}); // Ignore errors in logging
            
            throw new UnauthorizedException('Account is disabled');
        }

        // Generate access token
        const accessToken = await signToken({
            userId: user.id,
            email: user.email
        }, '1h');

        // Generate refresh token
        const refreshToken = await signToken({
            userId: user.id,
            email: user.email
        }, '7d');

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                ipAddress,
                userAgent,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // Log successful login
        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                ipAddress,
                userAgent,
                success: true
            }
        });

        return {
            user: new UserDto(user),
            accessToken,
            refreshToken
        };
    }

    /**
     * Get user login history
     */
    static async getLoginHistory(userId, limit = 10) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const history = await prisma.loginHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                success: true,
                createdAt: true
            }
        });

        return history;
    }

    /**
     * Get failed login attempts count
     */
    static async getFailedLoginAttempts(userId, timeWindowMinutes = 15) {
        const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        
        const count = await prisma.loginHistory.count({
            where: {
                userId,
                success: false,
                createdAt: {
                    gte: timeWindow
                }
            }
        });

        return count;
    }

    /**
     * Get user profile by ID
     */
    static async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return new UserDto(user);
    }

    /**
     * Update user profile
     */
    static async updateUser(userId, data) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data
        });

        return new UserDto(updatedUser);
    }

    /**
     * Logout user (revoke refresh token and blacklist access token)
     */
    static async logout(refreshToken, accessToken) {
        // Revoke refresh token
        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revokedAt: new Date() }
            });
        }

        // Blacklist access token
        if (accessToken) {
            const { BlacklistService } = await import('./blacklist.service.js');
            const { verifyToken } = await import('#lib/jwt');
            
            try {
                const payload = await verifyToken(accessToken);
                const expiresAt = new Date(payload.exp * 1000);
                await BlacklistService.addToBlacklist(accessToken, payload.userId, expiresAt);
            } catch (error) {
                // If token is invalid/expired, no need to blacklist
            }
        }

        return { success: true, message: 'Logged out successfully' };
    }
}
