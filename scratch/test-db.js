const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  try {
    const userCount = await prisma.user.count();
    console.log('Connection successful! User count:', userCount);
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
