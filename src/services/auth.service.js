import prisma from "#lib/prisma"
import { mailer } from "#lib/mailer"
import { ConflictException, UnauthorizedException, BadRequestException } from "#lib/exceptions"

export class AuthService {
    static async verifyEmail(token) {
    if (!token || typeof token !== "string") {
      throw new BadRequestException("Missing token")
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!record) throw new BadRequestException("Invalid token");
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("Token expired")
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      })

      await tx.verificationToken.delete({ where: { token } });
    })
  }
}
