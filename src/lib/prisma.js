import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Only load .env if variables aren't already set (allows test to override)
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

let prismaInstance = null;

// Lazy initialization - only create client when first accessed
export const prisma = new Proxy({}, {
  get(target, prop) {
    if (!prismaInstance) {
      // Ensure DATABASE_URL is set at initialization time
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      prismaInstance = new PrismaClient();
    }
    return prismaInstance[prop];
  }
});
