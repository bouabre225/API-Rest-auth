import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Set DATABASE_URL BEFORE any other imports
dotenv.config();
if (!process.env.DATABASE_URL) {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? path.resolve(process.cwd(), 'test.db')
    : path.resolve(process.cwd(), 'prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

let prismaInstance = null;
let db = null;
let adapter = null;

// Lazy initialization - only create client when first accessed
export const prisma = new Proxy({}, {
  get(target, prop) {
    if (!prismaInstance) {
      // Create DB and adapter only when needed
      if (!db) {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        db = new Database(dbPath);
        adapter = new PrismaBetterSqlite3(db);
      }
      
      // Initialize PrismaClient with adapter
      prismaInstance = new PrismaClient({ adapter });
    }
    return prismaInstance[prop];
  }
});
