import { AuthService } from "#services/auth.service";
import { BlacklistService } from "#services/blacklist.service";
import { prisma } from "#lib/prisma";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Malformed authorization header' });

  try {
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const payload = await AuthService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Check if user account is disabled
    if (user.disabledAt) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    req.user = user;
    req.token = token; // Store token for potential revocation
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}