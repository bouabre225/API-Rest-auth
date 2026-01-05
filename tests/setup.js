// Global test setup
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_de_32_caracteres_minimum';
process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
