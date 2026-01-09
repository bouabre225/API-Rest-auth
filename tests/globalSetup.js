// Global setup executed BEFORE loading any test files
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';
import { unlinkSync, existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  // Set environment variables BEFORE Jest loads any modules
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
  
  console.log('✅ Test environment variables set');
  
  // Setup test database
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
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  }
}
