import { Router, Request, Response, NextFunction } from 'express';
import { ConfigurationService } from '../services/ConfigurationService';
import { 
  createConfigSchema,
  updateConfigSchema,
  configurationFilterSchema,
  paginationSchema,
  cloneConfigSchema,
  bulkCreateSchema,
  bulkUpdateSchema,
  bulkDeleteSchema,
  cleanupSchema
} from '../utils/validation';
import logger from '../utils/logger';

/**
 * Express router for configuration management API endpoints
 */
export function createConfigurationRoutes(configService: ConfigurationService): Router {
  const router = Router();

  // Middleware for error handling
  const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Validation middleware
  const validateBody = (schema: any) => (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d: any) => d.message)
      });
      return;
    }
    req.body = value;
    next();
  };


  // Basic CRUD Operations

  /**
   * POST /api/v1/configurations
   * Create a new configuration
   */
  router.post('/', 
    validateBody(createConfigSchema),
    asyncHandler(async (req: Request, res: Response) => {
      logger.info('Creating new configuration', { 
        componentType: req.body.componentType,
        userId: req.body.userId 
      });

      const result = await configService.createConfiguration(req.body);
      res.status(201).json(result);
    })
  );

  // Bulk Operations

  /**
   * POST /api/v1/configurations/bulk
   * Bulk create configurations
   */
  router.post('/bulk',
    validateBody(bulkCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { configs } = req.body;
      
      logger.info('Bulk creating configurations', { count: configs.length });

      const result = await configService.bulkCreateConfigurations(configs);
      return res.status(201).json(result);
    })
  );

  /**
   * PUT /api/v1/configurations/bulk
   * Bulk update configurations
   */
  router.put('/bulk',
    validateBody(bulkUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { updates } = req.body;
      
      logger.info('Bulk updating configurations', { count: updates.length });

      const result = await configService.bulkUpdateConfigurations(updates);
      return res.json(result);
    })
  );

  /**
   * DELETE /api/v1/configurations/bulk
   * Bulk delete configurations
   */
  router.delete('/bulk',
    validateBody(bulkDeleteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { configIds } = req.body;
      
      logger.info('Bulk deleting configurations', { count: configIds.length });

      const result = await configService.bulkDeleteConfigurations(configIds);
      return res.json({ results: result });
    })
  );

  /**
   * GET /api/v1/configurations/:configId
   * Get configuration by ID
   */
  router.get('/:configId', 
    asyncHandler(async (req: Request, res: Response) => {
      const { configId } = req.params;
      
      logger.debug('Fetching configuration by ID', { configId });

      const result = await configService.findConfigurationById(configId);
      
      if (!result) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }
      
      res.json(result);
    })
  );

  /**
   * PUT /api/v1/configurations/:configId
   * Update configuration
   */
  router.put('/:configId',
    validateBody(updateConfigSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { configId } = req.params;
      
      logger.info('Updating configuration', { configId });

      try {
        const result = await configService.updateConfiguration(configId, req.body);
        return res.json(result);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: 'Configuration not found' });
        }
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/configurations/:configId
   * Soft delete configuration
   */
  router.delete('/:configId',
    asyncHandler(async (req: Request, res: Response) => {
      const { configId } = req.params;
      
      logger.info('Deleting configuration', { configId });

      const result = await configService.deleteConfiguration(configId);
      
      if (!result) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      return res.json({ success: true });
    })
  );

  // Advanced Operations

  /**
   * POST /api/v1/configurations/:configId/clone
   * Clone existing configuration
   */
  router.post('/:configId/clone',
    validateBody(cloneConfigSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { configId } = req.params;
      const { newName, userId } = req.body;
      
      logger.info('Cloning configuration', { configId, newName, userId });

      try {
        const result = await configService.cloneConfiguration(configId, newName, userId);
        return res.status(201).json(result);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: 'Configuration not found' });
        }
        throw error;
      }
    })
  );

  // Query Operations

  /**
   * GET /api/v1/configurations
   * Query configurations with optional pagination
   */
  router.get('/',
    asyncHandler(async (req: Request, res: Response) => {
      const { page, limit, sortBy, sortOrder, ...filterParams } = req.query;
      
      logger.debug('Querying configurations', { 
        hasPage: !!page, 
        filterKeys: Object.keys(filterParams) 
      });

      // Validate filter
      const { error: filterError, value: filter } = configurationFilterSchema.validate(filterParams);
      if (filterError) {
        return res.status(400).json({
          error: 'Filter validation failed',
          details: filterError.details.map((d: any) => d.message)
        });
      }

      // If pagination parameters are provided, use paginated query
      if (page || limit) {
        const { error: paginationError, value: paginationParams } = paginationSchema.validate({
          page, limit, sortBy, sortOrder
        });
        
        if (paginationError) {
          return res.status(400).json({
            error: 'Pagination validation failed',
            details: paginationError.details.map((d: any) => d.message)
          });
        }

        const result = await configService.queryConfigurationsWithPagination(
          filter,
          paginationParams.page,
          paginationParams.limit,
          paginationParams.sortBy,
          paginationParams.sortOrder
        );
        
        return res.json(result);
      }

      // Regular query without pagination
      const result = await configService.queryConfigurations(filter);
      return res.json(result);
    })
  );

  // Specialized Query Routes

  /**
   * GET /api/v1/configurations/by-app/:appId
   * Get configurations by app ID
   */
  router.get('/by-app/:appId',
    asyncHandler(async (req: Request, res: Response) => {
      const { appId } = req.params;
      const { includeDeleted } = req.query;
      
      logger.debug('Fetching configurations by app ID', { appId, includeDeleted });

      const result = await configService.findByAppId(appId, includeDeleted === 'true');
      res.json(result);
    })
  );

  /**
   * GET /api/v1/configurations/by-user/:userId
   * Get configurations by user ID
   */
  router.get('/by-user/:userId',
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { includeDeleted } = req.query;
      
      logger.debug('Fetching configurations by user ID', { userId, includeDeleted });

      const result = await configService.findByUserId(userId, includeDeleted === 'true');
      res.json(result);
    })
  );

  /**
   * GET /api/v1/configurations/by-component/:componentType
   * Get configurations by component type
   */
  router.get('/by-component/:componentType',
    asyncHandler(async (req: Request, res: Response) => {
      const { componentType } = req.params;
      const { componentSubType, includeDeleted } = req.query;
      
      logger.debug('Fetching configurations by component type', { 
        componentType, 
        componentSubType, 
        includeDeleted 
      });

      const result = await configService.findByComponentType(
        componentType,
        componentSubType as string,
        includeDeleted === 'true'
      );
      res.json(result);
    })
  );

  // System Operations

  /**
   * GET /api/v1/system/health
   * Get system health status
   */
  router.get('/system/health',
    asyncHandler(async (_req: Request, res: Response) => {
      const result = await configService.getHealthStatus();
      
      const statusCode = result.isHealthy ? 200 : 503;
      res.status(statusCode).json(result);
    })
  );

  /**
   * POST /api/v1/system/cleanup
   * Clean up old deleted configurations
   */
  router.post('/system/cleanup',
    validateBody(cleanupSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { dryRun } = req.body;
      
      logger.info('Running cleanup operation', { dryRun });

      const result = await configService.cleanupDeletedConfigurations(dryRun);
      res.json(result);
    })
  );

  // Test helper endpoint - only available in test environment
  if (process.env.NODE_ENV === 'test') {
    router.delete('/test/clear',
      asyncHandler(async (_req: Request, res: Response) => {
        logger.info('Clearing test database');
        
        // Access the storage directly to clear all data
        const storage = (configService as any).storage;
        if (storage && typeof storage.db?.exec === 'function') {
          storage.db.exec('DELETE FROM configurations');
          return res.json({ success: true, message: 'Database cleared' });
        }
        
        return res.json({ success: false, message: 'Cannot clear database' });
      })
    );
  }

  return router;
}