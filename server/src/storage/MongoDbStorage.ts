import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { IConfigurationStorage } from './IConfigurationStorage';
import { 
  UnifiedConfig, 
  ConfigurationFilter, 
  PaginatedResult, 
  StorageHealthStatus,
  BulkUpdateRequest,
  BulkUpdateResult,
  CleanupResult
} from '../types/configuration';

/**
 * MongoDB storage implementation for production environment
 * Uses MongoDB native driver with optimized indexes and aggregation pipelines
 */
export class MongoDbStorage implements IConfigurationStorage {
  private client: MongoClient;
  private db: Db;
  private collection: Collection<UnifiedConfig>;
  private isConnected = false;

  constructor() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'stern-configurations';
    const collectionName = process.env.MONGODB_COLLECTION || 'configurations';
    
    const options: MongoClientOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    this.client = new MongoClient(uri, options);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      await this.initializeIndexes();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  private async initializeIndexes(): Promise<void> {
    await Promise.all([
      // Compound indexes for common query patterns
      this.collection.createIndex({ appId: 1, userId: 1 }),
      this.collection.createIndex({ componentType: 1, componentSubType: 1 }),
      this.collection.createIndex({ userId: 1, deletedAt: 1 }),
      
      // Single field indexes
      this.collection.createIndex({ configId: 1 }, { unique: true }),
      this.collection.createIndex({ creationTime: -1 }),
      this.collection.createIndex({ lastUpdated: -1 }),
      this.collection.createIndex({ deletedAt: 1 }, { sparse: true }),
      this.collection.createIndex({ name: 1 }),
      
      // Text search index
      this.collection.createIndex({ 
        name: 'text', 
        description: 'text',
        tags: 'text'
      })
    ]);
  }

  async create(config: UnifiedConfig): Promise<UnifiedConfig> {
    try {
      await this.collection.insertOne(config as any);
      return config;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error(`Configuration with ID ${config.configId} already exists`);
      }
      throw error;
    }
  }

  async findById(configId: string): Promise<UnifiedConfig | null> {
    const result = await this.collection.findOne({ 
      configId, 
      deletedAt: { $exists: false } 
    } as any);
    
    return result ? this.sanitizeDocument(result) : null;
  }

  async update(configId: string, updates: Partial<UnifiedConfig>): Promise<UnifiedConfig> {
    const updateDoc = {
      ...updates,
      lastUpdated: new Date()
    };
    
    // Remove configId from updates to prevent ID changes
    delete (updateDoc as any).configId;
    
    const result = await this.collection.findOneAndUpdate(
      { configId, deletedAt: { $exists: false } } as any,
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new Error(`Configuration ${configId} not found`);
    }
    
    return this.sanitizeDocument(result);
  }

  async delete(configId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { configId, deletedAt: { $exists: false } } as any,
      { 
        $set: { 
          deletedAt: new Date(),
          deletedBy: 'system'
        }
      }
    );
    
    return result.modifiedCount > 0;
  }

  async clone(sourceConfigId: string, newName: string, userId: string): Promise<UnifiedConfig> {
    const sourceConfig = await this.findById(sourceConfigId);
    if (!sourceConfig) {
      throw new Error(`Configuration ${sourceConfigId} not found`);
    }

    const clonedConfig: UnifiedConfig = {
      ...sourceConfig,
      configId: uuidv4(),
      name: newName,
      createdBy: userId,
      lastUpdatedBy: userId,
      creationTime: new Date(),
      lastUpdated: new Date(),
      isDefault: false,
      isLocked: false,
      deletedAt: undefined,
      deletedBy: undefined
    };

    return this.create(clonedConfig);
  }

  async findByMultipleCriteria(criteria: ConfigurationFilter): Promise<UnifiedConfig[]> {
    const filter = this.buildMongoFilter(criteria);
    const cursor = this.collection.find(filter).sort({ lastUpdated: -1 });
    const results = await cursor.toArray();
    return results.map(doc => this.sanitizeDocument(doc));
  }

  async findByAppId(appId: string, includeDeleted = false): Promise<UnifiedConfig[]> {
    return this.findByMultipleCriteria({ appIds: [appId], includeDeleted });
  }

  async findByUserId(userId: string, includeDeleted = false): Promise<UnifiedConfig[]> {
    return this.findByMultipleCriteria({ userIds: [userId], includeDeleted });
  }

  async findByComponentType(
    componentType: string, 
    componentSubType?: string, 
    includeDeleted = false
  ): Promise<UnifiedConfig[]> {
    const criteria: ConfigurationFilter = {
      componentTypes: [componentType],
      includeDeleted
    };
    
    if (componentSubType) {
      criteria.componentSubTypes = [componentSubType];
    }
    
    return this.findByMultipleCriteria(criteria);
  }

  async findWithPagination(
    criteria: ConfigurationFilter,
    page: number,
    limit: number,
    sortBy = 'lastUpdated',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<UnifiedConfig>> {
    const filter = this.buildMongoFilter(criteria);
    
    // Count total documents
    const total = await this.collection.countDocuments(filter);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Fetch paginated data
    const cursor = this.collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    const results = await cursor.toArray();
    const data = results.map(doc => this.sanitizeDocument(doc));
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async bulkCreate(configs: UnifiedConfig[]): Promise<UnifiedConfig[]> {
    if (configs.length === 0) return [];
    
    try {
      await this.collection.insertMany(configs as any[]);
      return configs;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('One or more configurations already exist');
      }
      throw error;
    }
  }

  async bulkUpdate(updates: BulkUpdateRequest[]): Promise<BulkUpdateResult[]> {
    const results: BulkUpdateResult[] = [];
    
    // Use Promise.allSettled to handle partial failures
    const promises = updates.map(async (updateReq) => {
      try {
        await this.update(updateReq.configId, updateReq.updates);
        return { configId: updateReq.configId, success: true };
      } catch (error) {
        return { 
          configId: updateReq.configId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });
    
    const settledResults = await Promise.allSettled(promises);
    
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          configId: updates[index].configId,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
        });
      }
    });
    
    return results;
  }

  async bulkDelete(configIds: string[]): Promise<BulkUpdateResult[]> {
    const results: BulkUpdateResult[] = [];
    const now = new Date();
    
    const promises = configIds.map(async (configId) => {
      try {
        const success = await this.delete(configId);
        return { configId, success };
      } catch (error) {
        return { 
          configId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });
    
    const settledResults = await Promise.allSettled(promises);
    
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          configId: configIds[index],
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
        });
      }
    });
    
    return results;
  }

  async cleanup(dryRun = true): Promise<CleanupResult> {
    const retentionPeriod = 30; // 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);
    
    const filter = {
      deletedAt: { $exists: true, $lt: cutoffDate }
    };
    
    const toDelete = await this.collection.find(filter).toArray();
    const configs = toDelete.map(doc => this.sanitizeDocument(doc));
    
    if (!dryRun && toDelete.length > 0) {
      await this.collection.deleteMany(filter);
    }
    
    return {
      removedCount: toDelete.length,
      configs: dryRun ? configs : undefined
    };
  }

  async healthCheck(): Promise<StorageHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test basic database connectivity
      await this.collection.findOne({}, { limit: 1 });
      
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: true,
        connectionStatus: 'connected',
        lastChecked: new Date(),
        responseTime,
        storageType: 'mongodb'
      };
    } catch (error) {
      return {
        isHealthy: false,
        connectionStatus: 'error',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        storageType: 'mongodb'
      };
    }
  }

  private buildMongoFilter(criteria: ConfigurationFilter): any {
    const filter: any = {};

    // Exclude soft-deleted unless explicitly requested
    if (!criteria.includeDeleted) {
      filter.deletedAt = { $exists: false };
    }

    // Handle array filters with $in
    if (criteria.configIds?.length) {
      filter.configId = { $in: criteria.configIds };
    }

    if (criteria.appIds?.length) {
      filter.appId = { $in: criteria.appIds };
    }

    if (criteria.userIds?.length) {
      filter.userId = { $in: criteria.userIds };
    }

    if (criteria.componentTypes?.length) {
      filter.componentType = { $in: criteria.componentTypes };
    }

    if (criteria.componentSubTypes?.length) {
      filter.componentSubType = { $in: criteria.componentSubTypes };
    }

    if (criteria.categories?.length) {
      filter.category = { $in: criteria.categories };
    }

    // Handle text search with regex
    if (criteria.nameContains) {
      filter.name = { $regex: criteria.nameContains, $options: 'i' };
    }

    if (criteria.descriptionContains) {
      filter.description = { $regex: criteria.descriptionContains, $options: 'i' };
    }

    // Handle tags array - must contain all specified tags
    if (criteria.tags?.length) {
      filter.tags = { $all: criteria.tags };
    }

    // Handle boolean filters
    if (criteria.isShared !== undefined) {
      filter.isShared = criteria.isShared;
    }

    if (criteria.isDefault !== undefined) {
      filter.isDefault = criteria.isDefault;
    }

    if (criteria.isLocked !== undefined) {
      filter.isLocked = criteria.isLocked;
    }

    // Handle date range filters
    if (criteria.createdAfter || criteria.createdBefore) {
      filter.creationTime = {};
      if (criteria.createdAfter) {
        filter.creationTime.$gte = criteria.createdAfter;
      }
      if (criteria.createdBefore) {
        filter.creationTime.$lte = criteria.createdBefore;
      }
    }

    if (criteria.updatedAfter || criteria.updatedBefore) {
      filter.lastUpdated = {};
      if (criteria.updatedAfter) {
        filter.lastUpdated.$gte = criteria.updatedAfter;
      }
      if (criteria.updatedBefore) {
        filter.lastUpdated.$lte = criteria.updatedBefore;
      }
    }

    // Handle advanced filters
    if (criteria.hasVersions !== undefined) {
      if (criteria.hasVersions) {
        filter.settings = { $exists: true, $ne: [], $not: { $size: 0 } };
      } else {
        filter.$or = [
          { settings: { $exists: false } },
          { settings: [] },
          { settings: { $size: 0 } }
        ];
      }
    }

    if (criteria.activeSettingExists !== undefined) {
      if (criteria.activeSettingExists) {
        filter.activeSetting = { $exists: true, $ne: null, $ne: '' };
      } else {
        filter.$or = [
          { activeSetting: { $exists: false } },
          { activeSetting: null },
          { activeSetting: '' }
        ];
      }
    }

    return filter;
  }

  private sanitizeDocument(doc: any): UnifiedConfig {
    // Remove MongoDB's _id field and ensure proper typing
    const { _id, ...cleanDoc } = doc;
    return {
      ...cleanDoc,
      creationTime: new Date(cleanDoc.creationTime),
      lastUpdated: new Date(cleanDoc.lastUpdated),
      deletedAt: cleanDoc.deletedAt ? new Date(cleanDoc.deletedAt) : undefined
    };
  }
}