// tests/integration/setup.js
import { execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Set test environment variables if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
}

export function setupDatabase() {
  // Remove existing test database
  const dbPath = process.env.DATABASE_URL.replace('file:', '');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  
  // Push schema to create tables
  execSync('npx prisma db push', {
    env: process.env,
    stdio: 'inherit',
  });
}
