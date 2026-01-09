// tests/integration/setup.js
import { execSync } from 'node:child_process';
import { unlinkSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Set test environment variables if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
}

export async function setupDatabase() {
  try {
    // En mode test avec :memory:, on doit créer les tables manuellement
    if (process.env.NODE_ENV === 'test') {
      const { prisma } = await import('#lib/prisma');
      
      // Lire le schéma SQL généré par Prisma
      // On utilise les migrations ou on applique le schéma directement
      const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
      
      // Créer les tables via Prisma
      // Note: Avec :memory:, on ne peut pas utiliser db push
      // On doit créer les tables programmatiquement
      
      // Solution simple: utiliser $executeRawUnsafe pour créer les tables
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "emailVerifiedAt" DATETIME,
          "twoFactorSecret" TEXT,
          "twoFactorEnabledAt" DATETIME,
          "disabledAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RefreshToken" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "userAgent" TEXT,
          "ipAddress" TEXT,
          "expiresAt" DATETIME NOT NULL,
          "revokedAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlacklistedAccessToken" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "expiresAt" DATETIME NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LoginHistory" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "userId" TEXT NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "success" INTEGER NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "VerificationToken" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "expiresAt" DATETIME NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "expiresAt" DATETIME NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "OAuthAccount" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "provider" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
          UNIQUE("provider", "providerId")
        );
      `);
      
      console.log('✅ Tables créées en mémoire');
    } else {
      // En développement, utiliser prisma db push
      const dbPath = process.env.DATABASE_URL.replace('file:', '');
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
      
      execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env },
        stdio: 'pipe',
      });
    }
  } catch (error) {
    console.error('Database setup failed:', error.message);
    throw error;
  }
}
