import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ConfigurationService } from './services/ConfigurationService';
import { createConfigurationRoutes } from './routes/configurations';
import { StorageFactory } from './storage/StorageFactory';
import logger from './utils/logger';

export async function createApp(): Promise<express.Application> {
  const app = express();

  // Security middleware
  // Note: CSP is relaxed for development. In production, remove unsafe-inline and use nonces
  const isDevelopment = process.env.NODE_ENV !== 'production';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", ...(isDevelopment ? ["'unsafe-inline'"] : [])],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: !isDevelopment,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS configuration - All restrictions removed
  app.use(cors());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression middleware
  app.use(compression());

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });
    
    next();
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'stern-configuration-service',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Initialize storage and service
  let configService: ConfigurationService;
  try {
    // Validate environment before creating storage
    StorageFactory.validateEnvironment();
    
    // Create and initialize configuration service
    configService = new ConfigurationService();
    await configService.initialize();
    
    logger.info('Configuration service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize configuration service', { error });
    throw error;
  }

  // API routes
  app.use('/api/v1/configurations', createConfigurationRoutes(configService));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });

    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(error.status || 500).json({
      error: 'Internal Server Error',
      message: isDevelopment ? error.message : 'Something went wrong',
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString()
    });
  });

  // Graceful shutdown handler
  const shutdownHandler = async () => {
    logger.info('Received shutdown signal, starting graceful shutdown...');
    
    try {
      await configService.shutdown();
      logger.info('Configuration service shut down successfully');
    } catch (error) {
      logger.error('Error during service shutdown', { error });
    }
    
    process.exit(0);
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  return app;
}

export default createApp;