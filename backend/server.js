import app from './app.js';
import env from './Config/env.js';
import { connectDB, disconnectDB } from './Config/db.js';

async function startServer() {
  // Connect to PostgreSQL DB via Prisma
  await connectDB();

  // Start Express HTTP Server
  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
    console.log(`🔗 API Endpoint: http://localhost:${env.port}/api/v1`);
    console.log(`🏥 Health Check: http://localhost:${env.port}/api/v1/health`);
  });

  // Graceful Shutdown Logic
  const shutdown = async (signal) => {
    console.log(`\n⚠️  Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
      console.log('🛑 HTTP server closed.');
      await disconnectDB();
      console.log('👋 Process terminated successfully.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception thrown:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
}

startServer();