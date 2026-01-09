import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

console.log('Test SQLite en mémoire...');

// Créer une DB en mémoire
const db = new Database(':memory:');
const adapter = new PrismaBetterSqlite3(db);

console.log('Adapter créé');

try {
  const prisma = new PrismaClient({ adapter });
  console.log('✅ PrismaClient créé avec :memory:');
  
  // Pas besoin de count, juste voir si ça crash
  console.log('✅ SUCCESS - Pas de crash!');
  
  await prisma.$disconnect();
} catch (error) {
  console.error('❌ ERREUR:', error.message);
}
