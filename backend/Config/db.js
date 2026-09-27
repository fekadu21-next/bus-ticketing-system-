import { PrismaClient } from '@prisma/client';
import env from './env.js';

export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB(retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL database connected successfully via Prisma');
      return true;
    } catch (error) {
      if (attempt === retries) {
        console.warn('⚠️ PostgreSQL database connection warning:', error.message);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('🔌 PostgreSQL database disconnected');
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
  }
}

export default prisma;