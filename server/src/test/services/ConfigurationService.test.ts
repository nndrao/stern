import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ConfigurationService } from '../../services/ConfigurationService';
import { IConfigurationStorage } from '../../storage/IConfigurationStorage';
import { createMockUnifiedConfig, createMultipleMockConfigs } from '../utils/testData';
import { UnifiedConfig, BulkUpdateResult, StorageHealthStatus, CleanupResult } from '../../types/configuration';

// Mock storage implementation
class MockStorage implements IConfigurationStorage {
  private configs = new Map<string, UnifiedConfig>();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async create(config: UnifiedConfig): Promise<UnifiedConfig> {
    if (this.configs.has(config.configId)) {
      throw new Error('Configuration already exists');
    }
    this.configs.set(config.configId, { ...config });
    return { ...config };
  }

  async findById(configId: string, includeDeleted?: boolean): Promise<UnifiedConfig | null> {
    const config = this.configs.get(configId);
    if (!config) return null;
    if (config.deletedAt && !includeDeleted) return null;
    return { ...config };
  }

  async update(configId: string, updates: Partial<UnifiedConfig>): Promise<UnifiedConfig> {
    const existing = this.configs.get(configId);
    if (!existing || existing.deletedAt) {
      throw new Error('Configuration not found');
    }
    const updated = { ...existing, ...updates };
    this.configs.set(configId, updated);
    return { ...updated };
  }

  async delete(configId: string): Promise<boolean> {
    const existing = this.configs.get(configId);
    if (!existing || existing.deletedAt) return false;
    
    const deleted = { ...existing, deletedAt: new Date() };
    this.configs.set(configId, deleted);
    return true;
  }

  async clone(sourceConfigId: string, newName: string, userId: string): Promise<UnifiedConfig> {
    const source = this.configs.get(sourceConfigId);
    if (!source || source.deletedAt) {
      throw new Error('Source configuration not found');
    }
    
    const cloned: UnifiedConfig = {
      ...source,
      configId: `cloned-${sourceConfigId}`,
      name: newName,
      userId,
      creationTime: new Date(),
      lastUpdated: new Date(),
      deletedAt: null
    };
    
    this.configs.set(cloned.configId, cloned);
    return { ...cloned };
  }

  async findByMultipleCriteria(): Promise<UnifiedConfig[]> {
    return Array.from(this.configs.values()).filter(c => !c.deletedAt);
  }

  async findWithPagination(): Promise<any> {
    const data = Array.from(this.configs.values()).filter(c => !c.deletedAt);
    return {
      data,
      total: data.length,
      page: 1,
      limit: 50,
      totalPages: 1
    };
  }

  async findByAppId(): Promise<UnifiedConfig[]> {
    return Array.from(this.configs.values()).filter(c => !c.deletedAt);
  }

  async findByUserId(): Promise<UnifiedConfig[]> {
    return Array.from(this.configs.values()).filter(c => !c.deletedAt);
  }

  async findByComponentType(): Promise<UnifiedConfig[]> {
    return Array.from(this.configs.values()).filter(c => !c.deletedAt);
  }

  async bulkCreate(configs: UnifiedConfig[]): Promise<UnifiedConfig[]> {
    const results: UnifiedConfig[] = [];
    for (const config of configs) {
      results.push(await this.create(config));
    }
    return results;
  }

  async bulkUpdate(): Promise<BulkUpdateResult[]> {
    return [];
  }

  async bulkDelete(): Promise<BulkUpdateResult[]> {
    return [];
  }

  async cleanup(): Promise<CleanupResult> {
    return { removedCount: 0, dryRun: true };
  }

  async healthCheck(): Promise<StorageHealthStatus> {
    return {
      isHealthy: this.connected,
      connectionStatus: this.connected ? 'connected' : 'disconnected',
      lastChecked: new Date(),
      responseTime: 10,
      storageType: 'mock'
    };
  }
}

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    service = new ConfigurationService(mockStorage);
  });

  afterEach(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization failure', async () => {
      const failingStorage = {
        ...mockStorage,
        // @ts-ignore - Jest mock typing issue in strict mode
        connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
      } as any;
      
      const failingService = new ConfigurationService(failingStorage);
      
      await expect(failingService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('createConfiguration', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create a valid configuration', async () => {
      const configData = createMockUnifiedConfig();
      delete (configData as any).configId; // Remove to test auto-generation
      delete (configData as any).creationTime;
      delete (configData as any).lastUpdated;
      
      const result = await service.createConfiguration(configData);
      
      expect(result.configId).toBeDefined();
      expect(result.name).toBe(configData.name);
      expect(result.creationTime).toBeInstanceOf(Date);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should preserve provided configId', async () => {
      const configData = createMockUnifiedConfig();
      const originalId = configData.configId;
      
      const result = await service.createConfiguration(configData);
      
      expect(result.configId).toBe(originalId);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        name: 'Test',
        // Missing required fields
      } as any;
      
      await expect(service.createConfiguration(invalidConfig)).rejects.toThrow('Validation failed');
    });

    it('should handle storage creation errors', async () => {
      const config = createMockUnifiedConfig();
      
      // Create first to cause duplicate error
      await service.createConfiguration(config);
      
      await expect(service.createConfiguration(config)).rejects.toThrow();
    });
  });

  describe('findConfigurationById', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should find existing configuration', async () => {
      const config = createMockUnifiedConfig();
      await service.createConfiguration(config);
      
      const result = await service.findConfigurationById(config.configId);
      
      expect(result).not.toBeNull();
      expect(result?.configId).toBe(config.configId);
    });

    it('should return null for non-existent configuration', async () => {
      const result = await service.findConfigurationById('non-existent');
      
      expect(result).toBeNull();
    });

    it('should handle storage errors', async () => {
      // @ts-ignore - Jest mock typing issue in strict mode
      (mockStorage as any).findById = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      await expect(service.findConfigurationById('test-id')).rejects.toThrow('Storage error');
    });
  });

  describe('updateConfiguration', () => {
    let existingConfig: UnifiedConfig;

    beforeEach(async () => {
      await service.initialize();
      existingConfig = await service.createConfiguration(createMockUnifiedConfig());
    });

    it('should update existing configuration', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description'
      };
      
      const result = await service.updateConfiguration(existingConfig.configId, updates);
      
      expect(result.name).toBe(updates.name);
      expect(result.description).toBe(updates.description);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should validate updated configuration', async () => {
      const invalidUpdates = {
        componentType: 'invalid-type'
      };
      
      await expect(service.updateConfiguration(existingConfig.configId, invalidUpdates))
        .rejects.toThrow('Validation failed');
    });

    it('should handle non-existent configuration', async () => {
      const updates = { name: 'Updated Name' };
      
      await expect(service.updateConfiguration('non-existent', updates))
        .rejects.toThrow();
    });
  });

  describe('deleteConfiguration', () => {
    let existingConfig: UnifiedConfig;

    beforeEach(async () => {
      await service.initialize();
      existingConfig = await service.createConfiguration(createMockUnifiedConfig());
    });

    it('should delete existing configuration', async () => {
      const result = await service.deleteConfiguration(existingConfig.configId);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent configuration', async () => {
      const result = await service.deleteConfiguration('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('cloneConfiguration', () => {
    let existingConfig: UnifiedConfig;

    beforeEach(async () => {
      await service.initialize();
      existingConfig = await service.createConfiguration(createMockUnifiedConfig());
    });

    it('should clone existing configuration', async () => {
      const newName = 'Cloned Configuration';
      const userId = 'clone-user';
      
      const result = await service.cloneConfiguration(existingConfig.configId, newName, userId);
      
      expect(result.configId).not.toBe(existingConfig.configId);
      expect(result.name).toBe(newName);
      expect(result.userId).toBe(userId);
      expect(result.config).toEqual(existingConfig.config);
    });

    it('should handle non-existent source configuration', async () => {
      await expect(service.cloneConfiguration('non-existent', 'New Name', 'user'))
        .rejects.toThrow();
    });
  });

  describe('queryConfigurations', () => {
    beforeEach(async () => {
      await service.initialize();
      const configs = createMultipleMockConfigs(3);
      for (const config of configs) {
        await service.createConfiguration(config);
      }
    });

    it('should query configurations with valid filter', async () => {
      const filter = { appIds: ['test-app-1'] };
      
      const results = await service.queryConfigurations(filter);
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should reject invalid filter', async () => {
      const invalidFilter = { componentTypes: ['invalid-type'] };
      
      await expect(service.queryConfigurations(invalidFilter))
        .rejects.toThrow('Filter validation failed');
    });
  });

  describe('bulkCreateConfigurations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create multiple configurations', async () => {
      const configs = createMultipleMockConfigs(3).map(config => {
        delete (config as any).configId;
        return config;
      });
      
      const results = await service.bulkCreateConfigurations(configs);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.name).toBe(configs[index].name);
        expect(result.configId).toBeDefined();
      });
    });

    it('should reject empty array', async () => {
      await expect(service.bulkCreateConfigurations([])).rejects.toThrow('cannot be empty');
    });

    it('should reject too many configurations', async () => {
      const configs = createMultipleMockConfigs(51);
      
      await expect(service.bulkCreateConfigurations(configs))
        .rejects.toThrow('Cannot create more than 50');
    });

    it('should validate all configurations before creating', async () => {
      const configs = createMultipleMockConfigs(2);
      configs[1].componentType = 'invalid-type'; // Make one invalid
      
      await expect(service.bulkCreateConfigurations(configs))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('getHealthStatus', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return healthy status', async () => {
      const status = await service.getHealthStatus();
      
      expect(status.isHealthy).toBe(true);
      expect(status.connectionStatus).toBe('connected');
      expect(status.storageType).toBe('mock');
    });

    it('should handle storage health check errors', async () => {
      // @ts-ignore - Jest mock typing issue in strict mode
      (mockStorage as any).healthCheck = jest.fn().mockRejectedValue(new Error('Health check failed'));
      
      const status = await service.getHealthStatus();
      
      expect(status.isHealthy).toBe(false);
      expect(status.errorMessage).toBe('Health check failed');
    });
  });

  describe('cleanupDeletedConfigurations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should perform cleanup operation', async () => {
      const result = await service.cleanupDeletedConfigurations(true);
      
      expect(result.removedCount).toBeDefined();
      expect(result.dryRun).toBe(true);
    });

    it('should handle cleanup errors', async () => {
      // @ts-ignore - Jest mock typing issue in strict mode
      (mockStorage as any).cleanup = jest.fn().mockRejectedValue(new Error('Cleanup failed'));
      
      await expect(service.cleanupDeletedConfigurations()).rejects.toThrow('Cleanup failed');
    });
  });
});