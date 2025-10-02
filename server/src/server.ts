import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createApp } from './app';
import logger from './utils/logger';

// Load environment variables
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  logger.info('Loaded environment variables from .env file');
} else {
  logger.info('No .env file found, using system environment variables');
}

async function startServer(): Promise<void> {
  try {
    // Get port from environment or use default
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || 'localhost';

    // Validate port
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port: ${process.env.PORT}. Port must be a number between 1 and 65535.`);
    }

    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info('Created logs directory');
    }

    // Create data directory for SQLite (if needed)
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info('Created data directory');
    }

    // Log startup information
    logger.info('Starting Stern Configuration Service', {
      environment: process.env.NODE_ENV || 'development',
      port,
      host,
      databaseType: process.env.DATABASE_TYPE || 'auto-detect',
      logLevel: process.env.LOG_LEVEL || 'info',
      nodeVersion: process.version,
      platform: process.platform
    });

    // Create Express application
    const app = await createApp();

    // Start server
    const server = app.listen(port, host, () => {
      logger.info(`🚀 Server running at http://${host}:${port}`, {
        port,
        host,
        environment: process.env.NODE_ENV || 'development'
      });

      logger.info('Available endpoints:', {
        health: `http://${host}:${port}/health`,
        api: `http://${host}:${port}/api/v1/configurations`,
        docs: 'API documentation available in routes/configurations.ts comments'
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use. Please use a different port or stop the conflicting service.`);
      } else if (error.code === 'EACCES') {
        logger.error(`Permission denied to bind to port ${port}. Try using a port above 1024 or run with elevated privileges.`);
      } else {
        logger.error('Server error', { error: error.message, code: error.code });
      }
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, closing server...');
      
      server.close((error) => {
        if (error) {
          logger.error('Error during server close', { error });
          process.exit(1);
        } else {
          logger.info('Server closed successfully');
          process.exit(0);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Unhandled error during server startup', { error });
  process.exit(1);
});