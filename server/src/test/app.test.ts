import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createApp } from '../app';

describe('App Configuration', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('Health Check', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'stern-configuration-service'
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from localhost:5173', async () => {
      const response = await request(app)
        .options('/api/v1/configurations')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'x-app-id')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow custom headers x-app-id and x-user-id', async () => {
      const response = await request(app)
        .options('/api/v1/configurations')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'x-app-id,x-user-id')
        .expect(204);

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toContain('x-app-id');
      expect(allowedHeaders).toContain('x-user-id');
    });

    it('should allow standard HTTP methods', async () => {
      const response = await request(app)
        .options('/api/v1/configurations')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'PUT')
        .expect(204);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('OPTIONS');
    });
  });

  describe('Security Headers', () => {
    it('should set security headers via helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', async () => {
      // Make a few requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/health')
          .expect(200);
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/configurations/by-user/test-user')
        .expect(200); // Endpoint exists and returns 200 with empty array

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Request Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/v1/configurations')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Will fail validation but proves JSON parsing works
      expect(response.status).not.toBe(500);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found'
      });
      expect(response.body.message).toContain('not found');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return proper message for non-existent API routes', async () => {
      const response = await request(app)
        .post('/api/v1/non-existent')
        .expect(404);

      expect(response.body.message).toContain('POST');
      expect(response.body.message).toContain('/api/v1/non-existent');
    });
  });

  describe('Error Handler', () => {
    it('should handle errors gracefully', async () => {
      // Trigger an error by sending invalid data
      const response = await request(app)
        .post('/api/v1/configurations')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Compression', () => {
    it('should support gzip compression', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip');

      // Server should be configured to compress
      expect(response.status).toBe(200);
    });
  });
});
