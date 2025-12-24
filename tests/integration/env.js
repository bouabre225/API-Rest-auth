// tests/env.js
import path from 'node:path';
process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
