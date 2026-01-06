// Global test setup
import dotenv from 'dotenv';
import path from 'path';

// Set test environment variables BEFORE anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;

dotenv.config({ path: '.env.test' });
