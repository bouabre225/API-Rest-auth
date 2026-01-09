import { prisma } from '#lib/prisma';
import crypto from 'crypto';

export class VerificationService {
    /**
     * Generate a verification token for a user
     */
    static async generateVerificationToken(userId) {
        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Set expiration (24 hours)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Delete any existing verification tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { userId }
        });
        
        // Create new token
        const verificationToken = await prisma.verificationToken.create({
            data: {
                token,
                userId,
                expiresAt
            }
        });
        
        return verificationToken.token;
    }
    
    /**
     * Verify a token and mark email as verified
     */
    static async verifyEmail(token) {
        // Find the token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        });
        
        if (!verificationToken) {
            throw new Error('Invalid verification token');
        }
        
        // Check if expired
        if (verificationToken.expiresAt < new Date()) {
            await prisma.verificationToken.delete({
                where: { token }
            });
            throw new Error('Verification token has expired');
        }
        
        // Update user
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { emailVerifiedAt: new Date() }
        });
        
        // Delete the token
        await prisma.verificationToken.delete({
            where: { token }
        });
        
        return true;
    }
}
