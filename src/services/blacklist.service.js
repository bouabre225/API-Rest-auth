import { prisma } from "#lib/prisma";
import { logger } from "#lib/logger";

export class BlacklistService {
    /**
     * Add an access token to the blacklist
     */
    static async addToBlacklist(token, userId, expiresAt) {
        try {
            await prisma.blacklistedAccessToken.create({
                data: {
                    token,
                    userId,
                    expiresAt: new Date(expiresAt)
                }
            });

            logger.info({ userId }, 'Access token blacklisted');
        } catch (error) {
            // If token already exists in blacklist, ignore
            if (error.code === 'P2002') {
                logger.debug({ userId }, 'Token already blacklisted');
                return;
            }
            throw error;
        }
    }

    /**
     * Check if a token is blacklisted
     */
    static async isBlacklisted(token) {
        const blacklisted = await prisma.blacklistedAccessToken.findUnique({
            where: { token }
        });

        return !!blacklisted;
    }

    /**
     * Revoke a refresh token
     */
    static async revokeRefreshToken(token) {
        await prisma.refreshToken.updateMany({
            where: { 
                token,
                revokedAt: null
            },
            data: { 
                revokedAt: new Date() 
            }
        });

        logger.info('Refresh token revoked');
    }

    /**
     * Revoke all refresh tokens for a user
     */
    static async revokeAllUserTokens(userId) {
        const result = await prisma.refreshToken.updateMany({
            where: { 
                userId,
                revokedAt: null
            },
            data: { 
                revokedAt: new Date() 
            }
        });

        logger.info({ userId, count: result.count }, 'All user tokens revoked');
        return result.count;
    }

    /**
     * Clean up expired tokens from blacklist
     * Should be run periodically via cron job
     */
    static async cleanupExpiredTokens() {
        const now = new Date();

        // Delete expired blacklisted access tokens
        const deletedAccessTokens = await prisma.blacklistedAccessToken.deleteMany({
            where: {
                expiresAt: {
                    lt: now
                }
            }
        });

        // Delete old revoked refresh tokens (older than 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
            where: {
                revokedAt: {
                    not: null,
                    lt: thirtyDaysAgo
                }
            }
        });

        // Delete expired refresh tokens
        const expiredRefreshTokens = await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: now
                },
                revokedAt: null
            }
        });

        logger.info({
            deletedAccessTokens: deletedAccessTokens.count,
            deletedRefreshTokens: deletedRefreshTokens.count,
            expiredRefreshTokens: expiredRefreshTokens.count
        }, 'Token cleanup completed');

        return {
            deletedAccessTokens: deletedAccessTokens.count,
            deletedRefreshTokens: deletedRefreshTokens.count,
            expiredRefreshTokens: expiredRefreshTokens.count,
            total: deletedAccessTokens.count + deletedRefreshTokens.count + expiredRefreshTokens.count
        };
    }

    /**
     * Clean up old login history
     * Keep only last 90 days
     */
    static async cleanupOldLoginHistory() {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const deleted = await prisma.loginHistory.deleteMany({
            where: {
                createdAt: {
                    lt: ninetyDaysAgo
                }
            }
        });

        logger.info({ count: deleted.count }, 'Old login history cleaned up');
        return deleted.count;
    }

    /**
     * Get blacklist statistics
     */
    static async getBlacklistStats() {
        const totalBlacklisted = await prisma.blacklistedAccessToken.count();
        const totalRevoked = await prisma.refreshToken.count({
            where: { revokedAt: { not: null } }
        });

        return {
            blacklistedAccessTokens: totalBlacklisted,
            revokedRefreshTokens: totalRevoked
        };
    }
}
