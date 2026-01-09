// tests/integration/setup.js
import { execSync } from 'node:child_process';
import { unlinkSync, existsSync } from 'node:fs';
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
    // Remove existing test database
    const dbPath = path.resolve(process.cwd(), 'test.db');
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
    
    // Push schema to create tables
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'pipe',
    });
    
    console.log('✅ Tables créées dans test.db');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    throw error;
  }
}
