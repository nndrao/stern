import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SqliteStorage } from '../../storage/SqliteStorage';
import { createMockUnifiedConfig, createMultipleMockConfigs, createMockFilter } from '../utils/testData';
import { COMPONENT_TYPES } from '../../types/configuration';

describe('SqliteStorage', () => {
  let storage: SqliteStorage;

  beforeEach(async () => {
    // Use in-memory database for tests
    storage = new SqliteStorage(':memory:');
    await storage.connect();
  });

  afterEach(async () => {
    if (storage) {
      await storage.disconnect();
    }
  });

  describe('connect and disconnect', () => {
    it('should connect and disconnect successfully', async () => {
      const newStorage = new SqliteStorage(':memory:');
      
      await expect(newStorage.connect()).resolves.not.toThrow();
      await expect(newStorage.disconnect()).resolves.not.toThrow();
    });

    it('should handle multiple connections gracefully', async () => {
      await expect(storage.connect()).resolves.not.toThrow();
      await expect(storage.connect()).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new configuration', async () => {
      const config = createMockUnifiedConfig();
      
      const result = await storage.create(config);
      
      expect(result).toMatchObject(config);
      expect(result.configId).toBe(config.configId);
    });

    it('should reject duplicate configId', async () => {
      const config = createMockUnifiedConfig();
      
      await storage.create(config);
      
      await expect(storage.create(config)).rejects.toThrow();
    });

    it('should handle complex configuration data', async () => {
      const config = createMockUnifiedConfig({
        config: {
          theme: 'dark',
          layout: { type: 'grid', columns: 5 },
          settings: { autoSave: true, timeout: 30000 }
        }
      });
      
      const result = await storage.create(config);
      
      expect(result.config).toEqual(config.config);
    });
  });

  describe('findById', () => {
    it('should find configuration by ID', async () => {
      const config = createMockUnifiedConfig();
      await storage.create(config);
      
      const result = await storage.findById(config.configId);
      
      expect(result).not.toBeNull();
      expect(result?.configId).toBe(config.configId);
      expect(result?.name).toBe(config.name);
    });

    it('should return null for non-existent ID', async () => {
      const result = await storage.findById('non-existent-id');
      
      expect(result).toBeNull();
    });

    it('should not return soft-deleted configurations by default', async () => {
      const config = createMockUnifiedConfig();
      await storage.create(config);
      await storage.delete(config.configId);
      
      const result = await storage.findById(config.configId);
      
      expect(result).toBeNull();
    });

    it('should return soft-deleted configurations when includeDeleted is true', async () => {
      const config = createMockUnifiedConfig();
      await storage.create(config);
      await storage.delete(config.configId);
      
      const result = await storage.findById(config.configId, true);
      
      expect(result).not.toBeNull();
      expect(result?.deletedAt).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update existing configuration', async () => {
      const config = createMockUnifiedConfig();
      await storage.create(config);
      
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description',
        lastUpdated: new Date()
      };
      
      const result = await storage.update(config.configId, updates);
      
      expect(result.name).toBe(updates.name);
      expect(result.description).toBe(updates.description);
    });

    it('should throw error when updating non-existent configuration', async () => {
      const updates = { name: 'Updated Name' };
      
      await expect(storage.update('non-existent-id', updates)).rejects.toThrow('not found');
    });

    it('should not update soft-deleted configurations', async () => {
      const config = createMockUnifiedConfig();
      await storage.create(config);
      await storage.delete(config.configId);
      
      const updates = { name: 'Updated Name' };
      
      await expect(storage.update(config.configId, updates)).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('should soft delete configuration', async () => {
      const config = createMockUnifiedConfig();
      await storage.create(config);
      
      const result = await storage.delete(config.configId);
      
      expect(result).toBe(true);
      
      // Should not be found in regular search
      const found = await storage.findById(config.configId);
      expect(found).toBeNull();
      
      // Should be found when including deleted
      const foundDeleted = await storage.findById(config.configId, true);
      expect(foundDeleted?.deletedAt).toBeDefined();
    });

    it('should return false when deleting non-existent configuration', async () => {
      const result = await storage.delete('non-existent-id');
      
      expect(result).toBe(false);
    });
  });

  describe('clone', () => {
    it('should clone existing configuration', async () => {
      const originalConfig = createMockUnifiedConfig();
      await storage.create(originalConfig);
      
      const newName = 'Cloned Configuration';
      const userId = 'clone-user';
      
      const cloned = await storage.clone(originalConfig.configId, newName, userId);
      
      expect(cloned.configId).not.toBe(originalConfig.configId);
      expect(cloned.name).toBe(newName);
      expect(cloned.userId).toBe(userId);
      expect(cloned.config).toEqual(originalConfig.config);
    });

    it('should throw error when cloning non-existent configuration', async () => {
      await expect(storage.clone('non-existent-id', 'New Name', 'user'))
        .rejects.toThrow('not found');
    });
  });

  describe('findByMultipleCriteria', () => {
    beforeEach(async () => {
      const configs = createMultipleMockConfigs(5);
      for (const config of configs) {
        await storage.create(config);
      }
    });

    it('should find configurations by app ID', async () => {
      const filter = { appIds: ['test-app-1', 'test-app-2'] };
      
      const results = await storage.findByMultipleCriteria(filter);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => filter.appIds!.includes(r.appId))).toBe(true);
    });

    it('should find configurations by user ID', async () => {
      const filter = { userIds: ['test-user-1'] };
      
      const results = await storage.findByMultipleCriteria(filter);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.userId === 'test-user-1')).toBe(true);
    });

    it('should find configurations by component type', async () => {
      const filter = { componentTypes: [COMPONENT_TYPES.DATA_GRID] };
      
      const results = await storage.findByMultipleCriteria(filter);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.componentType === COMPONENT_TYPES.DATA_GRID)).toBe(true);
    });

    it('should combine multiple filter criteria', async () => {
      const filter = {
        appIds: ['test-app-1'],
        componentTypes: [COMPONENT_TYPES.DATA_GRID]
      };
      
      const results = await storage.findByMultipleCriteria(filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].appId).toBe('test-app-1');
      expect(results[0].componentType).toBe(COMPONENT_TYPES.DATA_GRID);
    });

    it('should return empty array when no matches found', async () => {
      const filter = { appIds: ['non-existent-app'] };
      
      const results = await storage.findByMultipleCriteria(filter);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('findWithPagination', () => {
    beforeEach(async () => {
      const configs = createMultipleMockConfigs(10);
      for (const config of configs) {
        await storage.create(config);
      }
    });

    it('should return paginated results', async () => {
      const filter = {};
      const page = 1;
      const limit = 5;
      
      const result = await storage.findWithPagination(filter, page, limit);
      
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should return second page correctly', async () => {
      const filter = {};
      const page = 2;
      const limit = 5;
      
      const result = await storage.findWithPagination(filter, page, limit);
      
      expect(result.data).toHaveLength(5);
      expect(result.page).toBe(2);
    });

    it('should handle page beyond available data', async () => {
      const filter = {};
      const page = 10;
      const limit = 5;
      
      const result = await storage.findWithPagination(filter, page, limit);
      
      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(10);
      expect(result.total).toBe(10);
    });

    it('should sort results correctly', async () => {
      const filter = {};
      const result = await storage.findWithPagination(filter, 1, 10, 'name', 'asc');
      
      const names = result.data.map(item => item.name);
      const sortedNames = [...names].sort();
      
      expect(names).toEqual(sortedNames);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      const status = await storage.healthCheck();
      
      expect(status.isHealthy).toBe(true);
      expect(status.connectionStatus).toBe('connected');
      expect(status.storageType).toBe('sqlite');
      expect(status.responseTime).toBeGreaterThan(0);
    });

    it('should return unhealthy status when disconnected', async () => {
      await storage.disconnect();
      
      const status = await storage.healthCheck();
      
      expect(status.isHealthy).toBe(false);
      expect(status.connectionStatus).toBe('disconnected');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple configurations', async () => {
      const configs = createMultipleMockConfigs(3);
      
      const results = await storage.bulkCreate(configs);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.configId).toBe(configs[index].configId);
      });
    });

    it('should handle partial failures gracefully', async () => {
      const configs = createMultipleMockConfigs(2);
      // Create the first one manually to cause a conflict
      await storage.create(configs[0]);
      
      await expect(storage.bulkCreate(configs)).rejects.toThrow();
    });
  });
});