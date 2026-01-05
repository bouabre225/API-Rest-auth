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
    static async login({ email, password }) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await verifyPassword(user.password, password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is disabled
        if (user.disabledAt) {
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
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // Log login history
        await prisma.loginHistory.create({
            data: {
                userId: user.id,
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
     * Logout user (revoke refresh token)
     */
    static async logout(refreshToken) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revokedAt: new Date() }
        });

        return { success: true, message: 'Logged out successfully' };
    }
}
