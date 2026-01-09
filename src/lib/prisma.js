import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is set (with fallback)
if (!process.env.DATABASE_URL) {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? path.resolve(process.cwd(), 'test.db')
    : path.resolve(process.cwd(), 'prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

let prismaInstance = null;

// Lazy initialization - only create client when first accessed
export const prisma = new Proxy({}, {
  get(target, prop) {
    if (!prismaInstance) {
      // Créer l'adapter avec la bonne syntaxe (config object, pas Database instance)
      const dbUrl = process.env.NODE_ENV === 'test' 
        ? 'file::memory:'  // En test, utiliser :memory:
        : process.env.DATABASE_URL;
      
      const adapter = new PrismaBetterSqlite3({
        url: dbUrl
      });
      
      // Initialize PrismaClient with adapter
      prismaInstance = new PrismaClient({ adapter });
    }
    return prismaInstance[prop];
  }
});
