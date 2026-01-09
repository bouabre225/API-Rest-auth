import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

console.log('Test adapter avec config correct...');

// BON USAGE: passer un objet config, pas une instance Database
const adapter = new PrismaBetterSqlite3({
  url: 'file::memory:'
});

console.log('Adapter créé');

try {
  const prisma = new PrismaClient({ adapter });
  console.log('✅ PrismaClient créé');
  
  await prisma.$disconnect();
  console.log('✅ SUCCESS!');
} catch (error) {
  console.error('❌ ERREUR:', error.message);
}
