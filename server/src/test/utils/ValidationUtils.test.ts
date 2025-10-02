import { describe, it, expect } from '@jest/globals';
import { ValidationUtils } from '../../utils/validation';
import { createMockUnifiedConfig, createMockConfigVersion } from './testData';
import { COMPONENT_TYPES } from '../../types/configuration';

describe('ValidationUtils', () => {
  describe('validateConfig', () => {
    it('should validate a complete valid configuration', () => {
      const config = createMockUnifiedConfig();
      const result = ValidationUtils.validateConfig(config);
      
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
      expect(result.value?.configId).toBe(config.configId);
    });

    it('should reject configuration with missing required fields', () => {
      const invalidConfig = {
        configId: 'test-id',
        // Missing required fields
      };
      
      const result = ValidationUtils.validateConfig(invalidConfig);
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('appId');
      expect(result.value).toBeUndefined();
    });

    it('should reject configuration with invalid component type', () => {
      const config = createMockUnifiedConfig({
        componentType: 'invalid-type'
      });
      
      const result = ValidationUtils.validateConfig(config);
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('componentType');
    });

    it('should reject configuration with invalid UUID format', () => {
      const config = createMockUnifiedConfig({
        configId: 'not-a-uuid'
      });
      
      const result = ValidationUtils.validateConfig(config);
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('configId');
    });
  });

  describe('validateFilter', () => {
    it('should validate a valid filter object', () => {
      const filter = {
        appIds: ['app1', 'app2'],
        componentTypes: [COMPONENT_TYPES.DATA_GRID],
        includeDeleted: false,
        createdAfter: new Date('2023-01-01')
      };
      
      const result = ValidationUtils.validateFilter(filter);
      
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    it('should allow empty filter object', () => {
      const filter = {};
      
      const result = ValidationUtils.validateFilter(filter);
      
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    it('should reject filter with invalid component types', () => {
      const filter = {
        componentTypes: ['invalid-type']
      };
      
      const result = ValidationUtils.validateFilter(filter);
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('componentTypes');
    });
  });

  describe('validatePagination', () => {
    it('should validate valid pagination parameters', () => {
      const params = {
        page: 1,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc' as const
      };
      
      const result = ValidationUtils.validatePagination(params);
      
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
      expect(result.value?.page).toBe(1);
    });

    it('should apply default values for missing parameters', () => {
      const params = {};
      
      const result = ValidationUtils.validatePagination(params);
      
      expect(result.error).toBeUndefined();
      expect(result.value?.page).toBe(1);
      expect(result.value?.limit).toBe(50);
      expect(result.value?.sortOrder).toBe('desc');
    });

    it('should reject invalid pagination parameters', () => {
      const params = {
        page: -1,
        limit: 200,
        sortBy: 'invalid-field'
      };
      
      const result = ValidationUtils.validatePagination(params);
      
      expect(result.error).toBeDefined();
    });
  });

  describe('validateActiveSetting', () => {
    it('should validate config with correct active setting', () => {
      const config = createMockUnifiedConfig();

      const error = ValidationUtils.validateActiveSetting(config);

      expect(error).toBeNull();
    });

    it('should allow empty activeSetting when there are no versions', () => {
      const config = createMockUnifiedConfig({
        activeSetting: '',
        settings: []
      });

      const error = ValidationUtils.validateActiveSetting(config);

      expect(error).toBeNull();
    });

    it('should allow null activeSetting when there are no versions', () => {
      const config = createMockUnifiedConfig({
        activeSetting: null as any,
        settings: []
      });

      const error = ValidationUtils.validateActiveSetting(config);

      expect(error).toBeNull();
    });

    it('should reject config with missing active setting when settings exist', () => {
      const config = createMockUnifiedConfig({
        activeSetting: ''
      });

      const error = ValidationUtils.validateActiveSetting(config);

      expect(error).toBe('activeSetting is required when settings array is not empty');
    });

    it('should reject config with empty settings array when activeSetting is specified', () => {
      const config = createMockUnifiedConfig({
        settings: [],
        activeSetting: '12345678-1234-1234-1234-123456789012'
      });

      const error = ValidationUtils.validateActiveSetting(config);

      expect(error).toBe('settings array cannot be empty when activeSetting is specified');
    });

    it('should reject config with invalid active setting reference', () => {
      const config = createMockUnifiedConfig({
        activeSetting: 'non-existent-id'
      });

      const error = ValidationUtils.validateActiveSetting(config);

      expect(error).toBe('activeSetting must reference a valid version in the settings array');
    });
  });

  describe('validateUniqueVersionNames', () => {
    it('should validate settings with unique names', () => {
      const settings = [
        createMockConfigVersion({ name: 'Version 1' }),
        createMockConfigVersion({ name: 'Version 2' }),
        createMockConfigVersion({ name: 'Version 3' })
      ];
      
      const error = ValidationUtils.validateUniqueVersionNames(settings);
      
      expect(error).toBeNull();
    });

    it('should reject settings with duplicate names', () => {
      const settings = [
        createMockConfigVersion({ name: 'Version 1' }),
        createMockConfigVersion({ name: 'Version 1' }), // Duplicate
        createMockConfigVersion({ name: 'Version 2' })
      ];
      
      const error = ValidationUtils.validateUniqueVersionNames(settings);
      
      expect(error).toBe('Version names must be unique within the settings array');
    });
  });

  describe('validateCompleteConfig', () => {
    it('should validate a complete, valid configuration', () => {
      const config = createMockUnifiedConfig();
      
      const error = ValidationUtils.validateCompleteConfig(config);
      
      expect(error).toBeNull();
    });

    it('should catch schema validation errors', () => {
      const invalidConfig = createMockUnifiedConfig({
        componentType: 'invalid-type'
      });
      
      const error = ValidationUtils.validateCompleteConfig(invalidConfig);
      
      expect(error).toBeDefined();
      expect(error).toContain('componentType');
    });

    it('should catch business rule violations', () => {
      const config = createMockUnifiedConfig({
        activeSetting: '12345678-1234-1234-1234-123456789012' // Valid UUID format but non-existent
      });
      
      const error = ValidationUtils.validateCompleteConfig(config);
      
      expect(error).toBe('activeSetting must reference a valid version in the settings array');
    });

    it('should catch duplicate version names', () => {
      const settings = [
        createMockConfigVersion({ name: 'Duplicate' }),
        createMockConfigVersion({ name: 'Duplicate' })
      ];
      
      const config = createMockUnifiedConfig({
        settings,
        activeSetting: settings[0].versionId
      });
      
      const error = ValidationUtils.validateCompleteConfig(config);
      
      expect(error).toBe('Version names must be unique within the settings array');
    });
  });
});