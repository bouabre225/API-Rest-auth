// tests/setup.js
import { execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { existsSync } from 'node:fs';
import './env.js'

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
