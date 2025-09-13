import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
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
 * SQLite storage implementation for development environment
 * Uses better-sqlite3 for high performance synchronous operations
 */
export class SqliteStorage implements IConfigurationStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.SQLITE_DATABASE_PATH || './data/stern-configs.db';
    this.ensureDirectoryExists();
    this.db = new Database(this.dbPath);
    this.initializeSchema();
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    // SQLite connections are established in constructor
    // This method exists for interface compatibility
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null as any; // Set to null so healthCheck can detect disconnected state
    }
  }

  private initializeSchema(): void {
    // Create configurations table with JSON support
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS configurations (
        configId TEXT PRIMARY KEY,
        appId TEXT NOT NULL,
        userId TEXT NOT NULL,
        componentType TEXT NOT NULL,
        componentSubType TEXT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        config TEXT NOT NULL,           -- JSON string
        settings TEXT NOT NULL,         -- JSON string (ConfigVersion[])
        activeSetting TEXT NOT NULL,
        tags TEXT,                      -- JSON string (string[])
        category TEXT,
        isShared BOOLEAN DEFAULT FALSE,
        isDefault BOOLEAN DEFAULT FALSE,
        isLocked BOOLEAN DEFAULT FALSE,
        createdBy TEXT NOT NULL,
        lastUpdatedBy TEXT NOT NULL,
        creationTime DATETIME NOT NULL,
        lastUpdated DATETIME NOT NULL,
        deletedAt DATETIME,
        deletedBy TEXT
      );
      
      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_app_user ON configurations(appId, userId);
      CREATE INDEX IF NOT EXISTS idx_component ON configurations(componentType, componentSubType);
      CREATE INDEX IF NOT EXISTS idx_user ON configurations(userId);
      CREATE INDEX IF NOT EXISTS idx_created ON configurations(creationTime);
      CREATE INDEX IF NOT EXISTS idx_updated ON configurations(lastUpdated);
      CREATE INDEX IF NOT EXISTS idx_deleted ON configurations(deletedAt);
      CREATE INDEX IF NOT EXISTS idx_name ON configurations(name);
    `);
  }

  async create(config: UnifiedConfig): Promise<UnifiedConfig> {
    const stmt = this.db.prepare(`
      INSERT INTO configurations (
        configId, appId, userId, componentType, componentSubType, name, description, icon,
        config, settings, activeSetting, tags, category, isShared, isDefault, isLocked,
        createdBy, lastUpdatedBy, creationTime, lastUpdated, deletedAt, deletedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        config.configId,
        config.appId,
        config.userId,
        config.componentType,
        config.componentSubType || null,
        config.name,
        config.description || null,
        config.icon || null,
        JSON.stringify(config.config),
        JSON.stringify(config.settings),
        config.activeSetting,
        config.tags ? JSON.stringify(config.tags) : null,
        config.category || null,
        config.isShared ? 1 : 0,
        config.isDefault ? 1 : 0,
        config.isLocked ? 1 : 0,
        config.createdBy,
        config.lastUpdatedBy,
        config.creationTime.toISOString(),
        config.lastUpdated.toISOString(),
        config.deletedAt ? config.deletedAt.toISOString() : null,
        config.deletedBy || null
      );
      
      return config;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`Configuration with ID ${config.configId} already exists`);
      }
      throw error;
    }
  }

  async findById(configId: string, includeDeleted = false): Promise<UnifiedConfig | null> {
    const whereClause = includeDeleted 
      ? 'WHERE configId = ?' 
      : 'WHERE configId = ? AND deletedAt IS NULL';
    const stmt = this.db.prepare(`SELECT * FROM configurations ${whereClause}`);
    const row = stmt.get(configId);
    return row ? this.deserializeConfig(row) : null;
  }

  async update(configId: string, updates: Partial<UnifiedConfig>): Promise<UnifiedConfig> {
    const existing = await this.findById(configId);
    if (!existing) {
      throw new Error(`Configuration ${configId} not found`);
    }

    const updated: UnifiedConfig = {
      ...existing,
      ...updates,
      configId: existing.configId, // Prevent ID changes
      lastUpdated: new Date()
    };

    const stmt = this.db.prepare(`
      UPDATE configurations SET
        appId = ?, userId = ?, componentType = ?, componentSubType = ?, name = ?,
        description = ?, icon = ?, config = ?, settings = ?, activeSetting = ?,
        tags = ?, category = ?, isShared = ?, isDefault = ?, isLocked = ?,
        lastUpdatedBy = ?, lastUpdated = ?
      WHERE configId = ?
    `);

    stmt.run(
      updated.appId,
      updated.userId,
      updated.componentType,
      updated.componentSubType || null,
      updated.name,
      updated.description || null,
      updated.icon || null,
      JSON.stringify(updated.config),
      JSON.stringify(updated.settings),
      updated.activeSetting,
      updated.tags ? JSON.stringify(updated.tags) : null,
      updated.category || null,
      updated.isShared ? 1 : 0,
      updated.isDefault ? 1 : 0,
      updated.isLocked ? 1 : 0,
      updated.lastUpdatedBy,
      updated.lastUpdated.toISOString(),
      configId
    );

    return updated;
  }

  async delete(configId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE configurations SET 
        deletedAt = ?, 
        deletedBy = ? 
      WHERE configId = ? AND deletedAt IS NULL
    `);
    
    const now = new Date().toISOString();
    const result = stmt.run(now, 'system', configId);
    return result.changes > 0;
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
      userId: userId,
      createdBy: userId,
      lastUpdatedBy: userId,
      creationTime: new Date(),
      lastUpdated: new Date(),
      isDefault: false,  // Clones are never default
      isLocked: false,   // Clones are never locked
      deletedAt: null,
      deletedBy: null
    };

    return this.create(clonedConfig);
  }

  async findByMultipleCriteria(criteria: ConfigurationFilter): Promise<UnifiedConfig[]> {
    const { whereClause, params } = this.buildWhereClause(criteria);
    const stmt = this.db.prepare(`SELECT * FROM configurations ${whereClause} ORDER BY lastUpdated DESC`);
    const rows = stmt.all(...params);
    return rows.map(row => this.deserializeConfig(row));
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
    const { whereClause, params } = this.buildWhereClause(criteria);
    
    // Count total records
    const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM configurations ${whereClause}`);
    const countResult = countStmt.get(...params) as { total: number };
    const total = countResult.total;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    // Fetch paginated data
    const dataStmt = this.db.prepare(`
      SELECT * FROM configurations ${whereClause} 
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(...params, limit, offset);
    const data = rows.map(row => this.deserializeConfig(row));
    
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
    const stmt = this.db.prepare(`
      INSERT INTO configurations (
        configId, appId, userId, componentType, componentSubType, name, description, icon,
        config, settings, activeSetting, tags, category, isShared, isDefault, isLocked,
        createdBy, lastUpdatedBy, creationTime, lastUpdated, deletedAt, deletedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((configs: UnifiedConfig[]) => {
      for (const config of configs) {
        stmt.run(
          config.configId,
          config.appId,
          config.userId,
          config.componentType,
          config.componentSubType || null,
          config.name,
          config.description || null,
          config.icon || null,
          JSON.stringify(config.config),
          JSON.stringify(config.settings),
          config.activeSetting,
          config.tags ? JSON.stringify(config.tags) : null,
          config.category || null,
          config.isShared ? 1 : 0,
          config.isDefault ? 1 : 0,
          config.isLocked ? 1 : 0,
          config.createdBy,
          config.lastUpdatedBy,
          config.creationTime.toISOString(),
          config.lastUpdated.toISOString(),
          config.deletedAt ? config.deletedAt.toISOString() : null,
          config.deletedBy || null
        );
      }
    });

    transaction(configs);
    return configs;
  }

  async bulkUpdate(updates: BulkUpdateRequest[]): Promise<BulkUpdateResult[]> {
    const results: BulkUpdateResult[] = [];
    
    const transaction = this.db.transaction(() => {
      for (const updateReq of updates) {
        try {
          this.update(updateReq.configId, updateReq.updates);
          results.push({ configId: updateReq.configId, success: true });
        } catch (error) {
          results.push({ 
            configId: updateReq.configId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    });

    transaction();
    return results;
  }

  async bulkDelete(configIds: string[]): Promise<BulkUpdateResult[]> {
    const results: BulkUpdateResult[] = [];
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      UPDATE configurations SET 
        deletedAt = ?, 
        deletedBy = ? 
      WHERE configId = ? AND deletedAt IS NULL
    `);

    const transaction = this.db.transaction(() => {
      for (const configId of configIds) {
        try {
          const result = stmt.run(now, 'system', configId);
          results.push({ 
            configId, 
            success: result.changes > 0 
          });
        } catch (error) {
          results.push({ 
            configId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    });

    transaction();
    return results;
  }

  async cleanup(dryRun = true): Promise<CleanupResult> {
    const retentionPeriod = 30; // 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);
    
    const selectStmt = this.db.prepare(`
      SELECT * FROM configurations 
      WHERE deletedAt IS NOT NULL AND deletedAt < ?
    `);
    
    const toDelete = selectStmt.all(cutoffDate.toISOString());
    const configs = toDelete.map(row => this.deserializeConfig(row));
    
    if (!dryRun && toDelete.length > 0) {
      const deleteStmt = this.db.prepare(`
        DELETE FROM configurations 
        WHERE deletedAt IS NOT NULL AND deletedAt < ?
      `);
      deleteStmt.run(cutoffDate.toISOString());
    }
    
    return {
      removedCount: toDelete.length,
      configs: dryRun ? configs : undefined,
      dryRun
    };
  }

  async healthCheck(): Promise<StorageHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check if database is disconnected
      if (!this.db) {
        return {
          isHealthy: false,
          connectionStatus: 'disconnected',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          storageType: 'sqlite'
        };
      }
      
      // Test basic database connectivity
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM configurations');
      stmt.get();
      
      const responseTime = Math.max(1, Date.now() - startTime); // Ensure minimum 1ms
      
      return {
        isHealthy: true,
        connectionStatus: 'connected',
        lastChecked: new Date(),
        responseTime,
        storageType: 'sqlite'
      };
    } catch (error) {
      return {
        isHealthy: false,
        connectionStatus: 'error',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        storageType: 'sqlite'
      };
    }
  }

  private buildWhereClause(criteria: ConfigurationFilter): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    // Always exclude soft-deleted unless explicitly requested
    if (!criteria.includeDeleted) {
      conditions.push('deletedAt IS NULL');
    }

    // Handle array filters with IN clauses
    if (criteria.configIds?.length) {
      conditions.push(`configId IN (${criteria.configIds.map(() => '?').join(',')})`);
      params.push(...criteria.configIds);
    }

    if (criteria.appIds?.length) {
      conditions.push(`appId IN (${criteria.appIds.map(() => '?').join(',')})`);
      params.push(...criteria.appIds);
    }

    if (criteria.userIds?.length) {
      conditions.push(`userId IN (${criteria.userIds.map(() => '?').join(',')})`);
      params.push(...criteria.userIds);
    }

    if (criteria.componentTypes?.length) {
      conditions.push(`componentType IN (${criteria.componentTypes.map(() => '?').join(',')})`);
      params.push(...criteria.componentTypes);
    }

    if (criteria.componentSubTypes?.length) {
      conditions.push(`componentSubType IN (${criteria.componentSubTypes.map(() => '?').join(',')})`);
      params.push(...criteria.componentSubTypes);
    }

    // Handle text search
    if (criteria.nameContains) {
      conditions.push('name LIKE ?');
      params.push(`%${criteria.nameContains}%`);
    }

    if (criteria.descriptionContains) {
      conditions.push('description LIKE ?');
      params.push(`%${criteria.descriptionContains}%`);
    }

    // Handle boolean filters
    if (criteria.isShared !== undefined) {
      conditions.push('isShared = ?');
      params.push(criteria.isShared);
    }

    if (criteria.isDefault !== undefined) {
      conditions.push('isDefault = ?');
      params.push(criteria.isDefault);
    }

    if (criteria.isLocked !== undefined) {
      conditions.push('isLocked = ?');
      params.push(criteria.isLocked);
    }

    // Handle date range filters
    if (criteria.createdAfter) {
      conditions.push('creationTime > ?');
      params.push(criteria.createdAfter.toISOString());
    }

    if (criteria.createdBefore) {
      conditions.push('creationTime < ?');
      params.push(criteria.createdBefore.toISOString());
    }

    if (criteria.updatedAfter) {
      conditions.push('lastUpdated > ?');
      params.push(criteria.updatedAfter.toISOString());
    }

    if (criteria.updatedBefore) {
      conditions.push('lastUpdated < ?');
      params.push(criteria.updatedBefore.toISOString());
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  private deserializeConfig(row: any): UnifiedConfig {
    return {
      configId: row.configId,
      appId: row.appId,
      userId: row.userId,
      componentType: row.componentType,
      componentSubType: row.componentSubType,
      name: row.name,
      description: row.description,
      icon: row.icon,
      config: JSON.parse(row.config),
      settings: JSON.parse(row.settings),
      activeSetting: row.activeSetting,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      category: row.category,
      isShared: Boolean(row.isShared),
      isDefault: Boolean(row.isDefault),
      isLocked: Boolean(row.isLocked),
      createdBy: row.createdBy,
      lastUpdatedBy: row.lastUpdatedBy,
      creationTime: new Date(row.creationTime),
      lastUpdated: new Date(row.lastUpdated),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      deletedBy: row.deletedBy || null
    };
  }
}