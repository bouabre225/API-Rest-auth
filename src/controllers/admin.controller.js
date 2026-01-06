import { asyncHandler } from "#lib/async-handler";
import { BlacklistService } from "#services/blacklist.service";
import { runCleanupManually } from "../jobs/cleanup.job.js";

export class AdminController {
    /**
     * Get blacklist statistics
     * GET /api/admin/blacklist/stats
     */
    static getBlacklistStats = asyncHandler(async (req, res) => {
        const stats = await BlacklistService.getBlacklistStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    });

    /**
     * Run cleanup manually
     * POST /api/admin/cleanup
     */
    static runCleanup = asyncHandler(async (req, res) => {
        const result = await runCleanupManually();

        res.status(200).json({
            success: true,
            message: 'Cleanup completed',
            data: result
        });
    });

    /**
     * Revoke all tokens for a user
     * POST /api/admin/users/:userId/revoke-tokens
     */
    static revokeUserTokens = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const count = await BlacklistService.revokeAllUserTokens(userId);

        res.status(200).json({
            success: true,
            message: `${count} tokens revoked`,
            data: { revokedCount: count }
        });
    });
}
