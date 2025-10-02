import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createApp } from '../../app';
import { createMockUnifiedConfig } from '../utils/testData';

describe('Configuration Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = await createApp();
  });

  describe('POST /api/v1/configurations', () => {
    it('should create a new configuration', async () => {
      const mockConfig = createMockUnifiedConfig();
      // Remove fields that should be auto-generated
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const response = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .set('Content-Type', 'application/json')
        .expect(201);

      expect(response.body).toHaveProperty('configId');
      expect(response.body.name).toBe(configData.name);
      expect(response.body.appId).toBe(configData.appId);
    });

    it('should reject invalid configuration data', async () => {
      const response = await request(app)
        .post('/api/v1/configurations')
        .send({ invalid: 'data' })
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should reject configuration with invalid componentType', async () => {
      const mockConfig = createMockUnifiedConfig({ componentType: 'invalid-type' as any });
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const response = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/configurations/:id', () => {
    it('should retrieve a configuration by ID', async () => {
      // First create a config
      const mockConfig = createMockUnifiedConfig();
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/v1/configurations/${createdId}`)
        .expect(200);

      expect(response.body.configId).toBe(createdId);
      expect(response.body.name).toBe(configData.name);
    });

    it('should return 404 for non-existent configuration', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';

      const response = await request(app)
        .get(`/api/v1/configurations/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/configurations/invalid-id')
        .expect(404); // Returns 404 because it's treated as non-existent ID

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/configurations/:id', () => {
    it('should update an existing configuration', async () => {
      // First create a config
      const mockConfig = createMockUnifiedConfig();
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      // Then update it
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/api/v1/configurations/${createdId}`)
        .send(updates)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body.configId).toBe(createdId);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
    });

    it('should reject update with invalid data', async () => {
      const mockConfig = createMockUnifiedConfig();
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      const response = await request(app)
        .put(`/api/v1/configurations/${createdId}`)
        .send({ componentType: 'invalid-type' })
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 when updating non-existent configuration', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';

      const response = await request(app)
        .put(`/api/v1/configurations/${fakeId}`)
        .send({ name: 'Updated Name' })
        .set('Content-Type', 'application/json')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/configurations/:id', () => {
    it('should soft delete a configuration', async () => {
      // First create a config
      const mockConfig = createMockUnifiedConfig();
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      // Then delete it
      await request(app)
        .delete(`/api/v1/configurations/${createdId}`)
        .expect(200);

      // Verify it's deleted (should return 404)
      await request(app)
        .get(`/api/v1/configurations/${createdId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent configuration', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';

      const response = await request(app)
        .delete(`/api/v1/configurations/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/configurations/by-user/:userId', () => {
    it('should retrieve configurations for a user', async () => {
      const userId = 'test-user-123';
      const mockConfig = createMockUnifiedConfig({ userId });
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      // Create a config for this user
      await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      // Retrieve configs for this user
      const response = await request(app)
        .get(`/api/v1/configurations/by-user/${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].userId).toBe(userId);
    });

    it('should filter by componentType', async () => {
      const userId = 'test-user-456';
      const mockConfig = createMockUnifiedConfig({ userId, componentType: 'dock' });
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const response = await request(app)
        .get(`/api/v1/configurations/by-user/${userId}`)
        .query({ componentType: 'dock' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((config: any) => {
        expect(config.componentType).toBe('dock');
      });
    });

    it('should not include deleted configurations by default', async () => {
      const userId = 'test-user-789';
      const mockConfig = createMockUnifiedConfig({ userId });
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      // Delete the config
      await request(app)
        .delete(`/api/v1/configurations/${createdId}`)
        .expect(200);

      // Query should not include deleted
      const response = await request(app)
        .get(`/api/v1/configurations/by-user/${userId}`)
        .expect(200);

      const deletedConfig = response.body.find((c: any) => c.configId === createdId);
      expect(deletedConfig).toBeUndefined();
    });
  });

  describe('POST /api/v1/configurations/:id/clone', () => {
    it('should clone an existing configuration', async () => {
      const mockConfig = createMockUnifiedConfig();
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      const response = await request(app)
        .post(`/api/v1/configurations/${createdId}/clone`)
        .send({
          newName: 'Cloned Configuration',
          userId: 'new-user'
        })
        .set('Content-Type', 'application/json')
        .expect(201);

      expect(response.body.configId).not.toBe(createdId);
      expect(response.body.name).toBe('Cloned Configuration');
      expect(response.body.userId).toBe('new-user');
    });

    it('should reject clone with missing required fields', async () => {
      const mockConfig = createMockUnifiedConfig();
      const { configId, creationTime, lastUpdated, deletedAt, deletedBy, ...configData } = mockConfig;

      const createResponse = await request(app)
        .post('/api/v1/configurations')
        .send(configData)
        .expect(201);

      const createdId = createResponse.body.configId;

      const response = await request(app)
        .post(`/api/v1/configurations/${createdId}/clone`)
        .send({ newName: 'Cloned Configuration' }) // Missing userId
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Validation Middleware', () => {
    it('should validate request body with schema', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        appId: 'test'
      };

      const response = await request(app)
        .post('/api/v1/configurations')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });
});
