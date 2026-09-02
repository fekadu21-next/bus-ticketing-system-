import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Tests database connectivity with Supabase using Prisma
 */
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("⚡ PostgreSQL connected successfully via Prisma & Supabase Pooler");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
};

export default prisma;