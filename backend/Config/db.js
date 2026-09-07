import { PrismaClient } from '@prisma/client';
import env from './env.js';

export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully via Prisma');
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL database connection warning:', error.message);
    return false;
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