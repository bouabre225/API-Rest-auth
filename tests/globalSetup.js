// Global setup executed BEFORE loading any test files
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  // Set environment variables BEFORE Jest loads any modules
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
  
  console.log('✅ Test environment variables set');
}
