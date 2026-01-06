#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set environment variables BEFORE Jest starts
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;

console.log('✅ Environment variables set');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Run Jest with the environment already set
const jest = spawn('npx', ['jest', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

jest.on('exit', (code) => {
  process.exit(code);
});
