// Initialize env vars first
require('../packages/shared/dist/queue/env.js');

const { prisma } = require('../packages/shared/dist/index.js');

async function main() {
  console.log('Connecting to database...');
  try {
    const userCount = await prisma.user.count();
    console.log('Connection successful! User count in DB:', userCount);
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
