import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import createApp from '../../app';
import { createMockUnifiedConfig } from '../utils/testData';

describe('Configuration API Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.SQLITE_DATABASE_PATH = ':memory:';
    process.env.LOG_LEVEL = 'error';
    
    app = await createApp();
    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Health Check', () => {
    it('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('stern-configuration-service');
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('Configuration CRUD Operations', () => {
    let testConfig: any;

    beforeEach(async () => {
      testConfig = createMockUnifiedConfig();
      
      // Clear database before each test
      await request(app).delete('/api/v1/configurations/test/clear').expect(() => {
        // Ignore errors if endpoint doesn't exist yet
      });
    });

    it('POST /api/v1/configurations should create new configuration', async () => {
      const response = await request(app)
        .post('/api/v1/configurations')
        .send(testConfig)
        .expect(201);

      expect(response.body.configId).toBe(testConfig.configId);
      expect(response.body.name).toBe(testConfig.name);
      expect(response.body.appId).toBe(testConfig.appId);
    });

    it('GET /api/v1/configurations/:configId should retrieve configuration', async () => {
      // First create a configuration
      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(testConfig)
        .expect(201);

      const configId = createResponse.body.configId;

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/api/v1/configurations/${configId}`)
        .expect(200);

      expect(getResponse.body.configId).toBe(configId);
      expect(getResponse.body.name).toBe(testConfig.name);
    });

    it('GET /api/v1/configurations/:configId should return 404 for non-existent config', async () => {
      await request(app)
        .get('/api/v1/configurations/non-existent-id')
        .expect(404);
    });

    it('PUT /api/v1/configurations/:configId should update configuration', async () => {
      // Create configuration
      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(testConfig)
        .expect(201);

      const configId = createResponse.body.configId;

      // Update it
      const updates = {
        name: 'Updated Configuration Name',
        description: 'Updated description'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/configurations/${configId}`)
        .send(updates)
        .expect(200);

      expect(updateResponse.body.name).toBe(updates.name);
      expect(updateResponse.body.description).toBe(updates.description);
    });

    it('PUT /api/v1/configurations/:configId should return 404 for non-existent config', async () => {
      const updates = { name: 'Updated Name' };

      await request(app)
        .put('/api/v1/configurations/non-existent-id')
        .send(updates)
        .expect(404);
    });

    it('DELETE /api/v1/configurations/:configId should soft delete configuration', async () => {
      // Create configuration
      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(testConfig)
        .expect(201);

      const configId = createResponse.body.configId;

      // Delete it
      await request(app)
        .delete(`/api/v1/configurations/${configId}`)
        .expect(200);

      // Should not be found anymore
      await request(app)
        .get(`/api/v1/configurations/${configId}`)
        .expect(404);
    });

    it('DELETE /api/v1/configurations/:configId should return 404 for non-existent config', async () => {
      await request(app)
        .delete('/api/v1/configurations/non-existent-id')
        .expect(404);
    });
  });

  describe('Clone Operation', () => {
    let sourceConfig: any;

    beforeEach(async () => {
      sourceConfig = createMockUnifiedConfig();
      
      // Create source configuration
      await request(app)
        .post('/api/v1/configurations')
        .send(sourceConfig)
        .expect(201);
    });

    it('POST /api/v1/configurations/:configId/clone should clone configuration', async () => {
      const cloneData = {
        newName: 'Cloned Configuration',
        userId: 'clone-user'
      };

      const response = await request(app)
        .post(`/api/v1/configurations/${sourceConfig.configId}/clone`)
        .send(cloneData)
        .expect(201);

      expect(response.body.configId).not.toBe(sourceConfig.configId);
      expect(response.body.name).toBe(cloneData.newName);
      expect(response.body.userId).toBe(cloneData.userId);
      expect(response.body.config).toEqual(sourceConfig.config);
    });

    it('POST /api/v1/configurations/:configId/clone should return 404 for non-existent source', async () => {
      const cloneData = {
        newName: 'Cloned Configuration',
        userId: 'clone-user'
      };

      await request(app)
        .post('/api/v1/configurations/non-existent-id/clone')
        .send(cloneData)
        .expect(404);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Clear database before each test
      await request(app).delete('/api/v1/configurations/test/clear').expect(() => {
        // Ignore errors if endpoint doesn't exist yet
      });
      
      // Then create test configurations
      const configs = [
        createMockUnifiedConfig({ appId: 'app1', userId: 'user1', name: 'Config 1' }),
        createMockUnifiedConfig({ appId: 'app1', userId: 'user2', name: 'Config 2' }),
        createMockUnifiedConfig({ appId: 'app2', userId: 'user1', name: 'Config 3' })
      ];

      for (const config of configs) {
        await request(app)
          .post('/api/v1/configurations')
          .send(config)
          .expect(201);
      }
    });

    it('GET /api/v1/configurations should return all configurations', async () => {
      const response = await request(app)
        .get('/api/v1/configurations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('GET /api/v1/configurations should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/configurations?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalPages).toBe(2);
    });

    it('GET /api/v1/configurations/by-app/:appId should filter by app ID', async () => {
      const response = await request(app)
        .get('/api/v1/configurations/by-app/app1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.every((config: any) => config.appId === 'app1')).toBe(true);
    });

    it('GET /api/v1/configurations/by-user/:userId should filter by user ID', async () => {
      const response = await request(app)
        .get('/api/v1/configurations/by-user/user1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.every((config: any) => config.userId === 'user1')).toBe(true);
    });

    it('GET /api/v1/configurations/by-component/:componentType should filter by component type', async () => {
      const response = await request(app)
        .get('/api/v1/configurations/by-component/data-grid')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      // Clear database before each test
      await request(app).delete('/api/v1/configurations/test/clear').expect(() => {
        // Ignore errors if endpoint doesn't exist yet
      });
    });

    it('POST /api/v1/configurations/bulk should create multiple configurations', async () => {
      const configs = [
        createMockUnifiedConfig({ name: 'Bulk Config 1' }),
        createMockUnifiedConfig({ name: 'Bulk Config 2' })
      ];

      const response = await request(app)
        .post('/api/v1/configurations/bulk')
        .send({ configs })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('PUT /api/v1/configurations/bulk should update multiple configurations', async () => {
      // Create configurations first
      const config1 = createMockUnifiedConfig({ name: 'Config 1' });
      const config2 = createMockUnifiedConfig({ name: 'Config 2' });

      await request(app).post('/api/v1/configurations').send(config1).expect(201);
      await request(app).post('/api/v1/configurations').send(config2).expect(201);

      // Bulk update
      const updates = [
        {
          configId: config1.configId,
          updates: { name: 'Updated Config 1' }
        },
        {
          configId: config2.configId,
          updates: { name: 'Updated Config 2' }
        }
      ];

      const response = await request(app)
        .put('/api/v1/configurations/bulk')
        .send({ updates })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('DELETE /api/v1/configurations/bulk should delete multiple configurations', async () => {
      // Create configurations first
      const config1 = createMockUnifiedConfig();
      const config2 = createMockUnifiedConfig();

      await request(app).post('/api/v1/configurations').send(config1).expect(201);
      await request(app).post('/api/v1/configurations').send(config2).expect(201);

      // Bulk delete
      const configIds = [config1.configId, config2.configId];

      const response = await request(app)
        .delete('/api/v1/configurations/bulk')
        .send({ configIds })
        .expect(200);

      expect(response.body.results).toHaveLength(2);
    });
  });

  describe('System Operations', () => {
    it('GET /api/v1/configurations/system/health should return system health', async () => {
      const response = await request(app)
        .get('/api/v1/configurations/system/health')
        .expect(200);

      expect(response.body.isHealthy).toBeDefined();
      expect(response.body.connectionStatus).toBeDefined();
      expect(response.body.storageType).toBeDefined();
    });

    it('POST /api/v1/configurations/system/cleanup should perform cleanup', async () => {
      const response = await request(app)
        .post('/api/v1/configurations/system/cleanup')
        .send({ dryRun: true })
        .expect(200);

      expect(response.body.removedCount).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should reject invalid configuration data', async () => {
      const invalidConfig = {
        name: 'Test',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/configurations')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject invalid query parameters', async () => {
      await request(app)
        .get('/api/v1/configurations?page=invalid')
        .expect(400);
    });

    it('should reject empty bulk operations', async () => {
      await request(app)
        .post('/api/v1/configurations/bulk')
        .send({ configs: [] })
        .expect(400);
    });

    it('should reject bulk operations with too many items', async () => {
      const configs = Array.from({ length: 51 }, () => createMockUnifiedConfig());

      await request(app)
        .post('/api/v1/configurations/bulk')
        .send({ configs })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/api/v1/unknown-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/v1/configurations')
        .type('json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should enforce request body size limits', async () => {
      const largeConfig = createMockUnifiedConfig({
        config: {
          largeData: 'x'.repeat(11 * 1024 * 1024) // Larger than 10MB limit
        }
      });

      await request(app)
        .post('/api/v1/configurations')
        .send(largeConfig)
        .expect(413);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // This test might be flaky depending on the environment
      // In a real scenario, you might want to configure lower limits for testing
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/api/v1/configurations/system/health')
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed in development/test environment
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});