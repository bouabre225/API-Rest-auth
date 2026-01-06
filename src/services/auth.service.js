import { verifyToken } from "#lib/jwt";
import { AuthTokenDto } from "#dto/authToken.dto";

export class AuthService {
    static async verifyAccessToken(token) {
        const payload = await verifyToken(token);

        return new AuthTokenDto({
            userId: payload.userId,
            email: payload.email
        });
    }
}