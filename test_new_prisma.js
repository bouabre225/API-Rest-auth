process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test_new.db';

console.log('Test nouveau Prisma sans adapter...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

import('./src/lib/prisma.js').then(async ({ prisma }) => {
  console.log('Prisma importé OK');
  
  try {
    const count = await prisma.user.count();
    console.log('✅ SUCCESS - Count users:', count);
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
  }
  
  await prisma.$disconnect();
  process.exit(0);
}).catch(e => {
  console.error('Erreur import:', e.message);
  process.exit(1);
});
